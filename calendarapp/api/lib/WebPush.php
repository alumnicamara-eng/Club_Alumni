<?php
/**
 * Pure-PHP Web Push (RFC 8030 + RFC 8291 + VAPID RFC 8292)
 * Sin dependencias de Composer. Solo OpenSSL nativo (PHP 7.3+).
 *
 * Uso:
 *   $wp = new WebPush($vapidPublic, $vapidPrivate, 'mailto:admin@camarafp.es');
 *   $wp->send($subscription, json_encode(['title' => 'Hola', 'body' => '...']));
 *
 * Donde $subscription es ['endpoint'=>..., 'keys'=>['p256dh'=>..., 'auth'=>...]]
 */

class WebPush {
    private string $vapidPublic;   // base64url, 65 bytes uncompressed
    private string $vapidPrivate;  // base64url, 32 bytes
    private string $subject;       // mailto:... o URL

    public function __construct(string $vapidPublicB64, string $vapidPrivateB64, string $subject) {
        $this->vapidPublic  = $vapidPublicB64;
        $this->vapidPrivate = $vapidPrivateB64;
        $this->subject      = $subject;
    }

    /* ============================================================
     * GENERACIÓN DE CLAVES VAPID (ejecutar UNA vez)
     * ============================================================ */
    public static function generateVapidKeys(): array {
        $pk = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        if (!$pk) throw new RuntimeException('No se pudo generar par EC');
        $det = openssl_pkey_get_details($pk);
        $x = str_pad($det['ec']['x'], 32, "\0", STR_PAD_LEFT);
        $y = str_pad($det['ec']['y'], 32, "\0", STR_PAD_LEFT);
        $d = str_pad($det['ec']['d'], 32, "\0", STR_PAD_LEFT);
        $public  = "\x04" . $x . $y;            // 65 bytes uncompressed
        return [
            'publicKey'  => self::b64url($public),
            'privateKey' => self::b64url($d),
        ];
    }

    /* ============================================================
     * ENVIAR PUSH a UN suscriptor (devuelve [success, http_code, error])
     * ============================================================ */
    public function send(array $sub, string $payload): array {
        $endpoint = $sub['endpoint'] ?? '';
        $p256dh   = self::b64urlDecode($sub['keys']['p256dh'] ?? '');
        $auth     = self::b64urlDecode($sub['keys']['auth']   ?? '');
        if (!$endpoint || strlen($p256dh) !== 65 || strlen($auth) !== 16) {
            return [false, 0, 'Suscripción inválida'];
        }

        // 1) Cifrar el payload (aes128gcm — RFC 8291)
        [$body, $serverPub] = $this->encryptPayload($payload, $p256dh, $auth);

        // 2) Generar VAPID JWT
        $audience = $this->originOf($endpoint);
        $jwt = $this->buildVapidJwt($audience);

        // 3) Cabeceras
        $headers = [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'TTL: 86400',
            'Urgency: normal',
            'Authorization: vapid t=' . $jwt . ', k=' . $this->vapidPublic,
        ];

        // 4) POST a la endpoint del push service del navegador
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $res  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        $ok = ($code >= 200 && $code < 300);
        return [$ok, $code, $ok ? null : ($err ?: $res)];
    }

    /* ============================================================
     * Cifrado del payload (aes128gcm, RFC 8291)
     * ============================================================ */
    private function encryptPayload(string $payload, string $clientPub, string $clientAuth): array {
        // (a) Par efímero del servidor
        $serverKey = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        $det = openssl_pkey_get_details($serverKey);
        $serverPubRaw = "\x04"
            . str_pad($det['ec']['x'], 32, "\0", STR_PAD_LEFT)
            . str_pad($det['ec']['y'], 32, "\0", STR_PAD_LEFT);

        // (b) ECDH compartido con el cliente
        $clientPubKey = self::ecPublicKeyFromRaw($clientPub);
        $shared = openssl_pkey_derive($clientPubKey, $serverKey, 32);
        if (!$shared) throw new RuntimeException('ECDH falló');

        // (c) HKDF según RFC 8291 (auth = salt del primer extract)
        $prkKey  = hash_hmac('sha256', $shared, $clientAuth, true);
        $keyInfo = "WebPush: info\0" . $clientPub . $serverPubRaw;
        $ikm     = hash_hmac('sha256', $keyInfo . "\x01", $prkKey, true); // 32 bytes

        // (d) Salt + PRK + CEK + nonce
        $salt    = random_bytes(16);
        $prk     = hash_hmac('sha256', $ikm, $salt, true);
        $cek     = substr(hash_hmac('sha256', "Content-Encoding: aes128gcm\0\x01", $prk, true), 0, 16);
        $nonce   = substr(hash_hmac('sha256', "Content-Encoding: nonce\0\x01",     $prk, true), 0, 12);

        // (e) Padding RFC 8188: payload || 0x02 || zeros (sin padding aquí)
        $plaintext = $payload . "\x02";

        // (f) AES-128-GCM
        $tag        = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($ciphertext === false) throw new RuntimeException('AES-GCM falló');

        // (g) Cabecera RFC 8188: salt(16) || recordSize(4) || keyIdLen(1) || keyId
        $recordSize = strlen($ciphertext) + strlen($tag) + 17; // +17 = padding(1)+tag(16)
        $header = $salt
            . pack('N', $recordSize)
            . chr(strlen($serverPubRaw))
            . $serverPubRaw;

        return [$header . $ciphertext . $tag, $serverPubRaw];
    }

    /* ============================================================
     * VAPID JWT (ES256) — RFC 8292
     * ============================================================ */
    private function buildVapidJwt(string $audience): string {
        $header = ['typ' => 'JWT', 'alg' => 'ES256'];
        $claims = [
            'aud' => $audience,
            'exp' => time() + 12 * 3600,  // 12h
            'sub' => $this->subject,
        ];
        $signingInput = self::b64url(json_encode($header, JSON_UNESCAPED_SLASHES))
            . '.' . self::b64url(json_encode($claims, JSON_UNESCAPED_SLASHES));

        $privKey = self::ecPrivateKeyFromRaw(self::b64urlDecode($this->vapidPrivate));
        $sig     = '';
        if (!openssl_sign($signingInput, $sig, $privKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Firma JWT falló');
        }
        $rawSig = self::derSigToRaw($sig);  // OpenSSL devuelve DER, JWT necesita raw r||s
        return $signingInput . '.' . self::b64url($rawSig);
    }

    /* ============================================================
     * Helpers: claves EC desde bytes crudos
     * ============================================================ */
    private static function ecPublicKeyFromRaw(string $raw): \OpenSSLAsymmetricKey {
        // Envuelve los 65 bytes uncompressed en DER + PEM
        $der = self::pubKeyDer($raw);
        $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64) . "-----END PUBLIC KEY-----\n";
        $k   = openssl_pkey_get_public($pem);
        if (!$k) throw new RuntimeException('Clave EC pública inválida');
        return $k;
    }

    private static function ecPrivateKeyFromRaw(string $rawD): \OpenSSLAsymmetricKey {
        // Reconstruye public a partir de private (multiplicación por el generador no es trivial sin gmp).
        // Solución: generar key, sobreescribir 'd' no es posible vía API alta. Usamos manual.
        // Truco fiable: usar el PEM con SEC1 (con la d) y dejar que OpenSSL recompute el público.
        $sec1 = self::sec1FromPrivate($rawD);
        $pem  = "-----BEGIN EC PRIVATE KEY-----\n" . chunk_split(base64_encode($sec1), 64) . "-----END EC PRIVATE KEY-----\n";
        $k    = openssl_pkey_get_private($pem);
        if (!$k) throw new RuntimeException('Clave EC privada inválida');
        return $k;
    }

    /** SEC1 ECPrivateKey envoltorio mínimo para P-256 */
    private static function sec1FromPrivate(string $d): string {
        // ECPrivateKey ::= SEQUENCE { version INTEGER (1), privateKey OCTET STRING, parameters [0] OID prime256v1 }
        $oid = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"; // 1.2.840.10045.3.1.7 (prime256v1)
        $params = "\xa0" . self::derLen(strlen($oid)) . $oid;
        $privOctet = "\x04" . self::derLen(strlen($d)) . $d;
        $version   = "\x02\x01\x01";
        $seq       = $version . $privOctet . $params;
        return "\x30" . self::derLen(strlen($seq)) . $seq;
    }

    /** SubjectPublicKeyInfo para EC P-256 desde 65 bytes uncompressed */
    private static function pubKeyDer(string $rawPub): string {
        $algo = "\x30\x13"   // SEQUENCE 19
              . "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01"  // OID ecPublicKey
              . "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"; // OID prime256v1
        $bitString = "\x03" . self::derLen(strlen($rawPub) + 1) . "\x00" . $rawPub;
        $seq = $algo . $bitString;
        return "\x30" . self::derLen(strlen($seq)) . $seq;
    }

    private static function derLen(int $n): string {
        if ($n < 0x80) return chr($n);
        $b = ltrim(pack('N', $n), "\x00");
        return chr(0x80 | strlen($b)) . $b;
    }

    /** Convierte firma DER (ECDSA) a r||s (64 bytes para P-256) */
    private static function derSigToRaw(string $der): string {
        if ($der[0] !== "\x30") throw new RuntimeException('DER inválido');
        $offset = 2 + (ord($der[1]) & 0x80 ? (ord($der[1]) & 0x7f) : 0);
        // r
        if ($der[$offset] !== "\x02") throw new RuntimeException('DER r inválido');
        $rLen = ord($der[$offset + 1]);
        $r    = substr($der, $offset + 2, $rLen);
        $offset += 2 + $rLen;
        // s
        if ($der[$offset] !== "\x02") throw new RuntimeException('DER s inválido');
        $sLen = ord($der[$offset + 1]);
        $s    = substr($der, $offset + 2, $sLen);
        // Quitar bytes de signo y rellenar a 32
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
        return $r . $s;
    }

    private function originOf(string $url): string {
        $p = parse_url($url);
        return ($p['scheme'] ?? 'https') . '://' . ($p['host'] ?? '') . (isset($p['port']) ? ':' . $p['port'] : '');
    }

    /* ===== Base64url helpers ===== */
    public static function b64url(string $b): string {
        return rtrim(strtr(base64_encode($b), '+/', '-_'), '=');
    }
    public static function b64urlDecode(string $s): string {
        $pad = strlen($s) % 4;
        if ($pad) $s .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($s, '-_', '+/')) ?: '';
    }
}

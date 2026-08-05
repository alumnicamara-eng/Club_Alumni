document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("✅ Login correcto");
        window.location.href = "admin.html";
    }
});
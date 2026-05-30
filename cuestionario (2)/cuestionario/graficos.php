<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gráficos encuesta</title>
<link rel="stylesheet" href="./css/style.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<div class="form-container">
    <h2>Valoración general</h2>
    <div class="chart-container">
        <canvas id="grafico"></canvas>
    </div>
</div>

<script>

const data = {
labels: [
'Opportunity Board',
'Comunidad',
'Ligas',
'Ventajas'
],

datasets: [{
label: 'Valoración media',
data: [
<?php echo $datos[5] ?? 0 ?>,
<?php echo $datos[6] ?? 0 ?>,
<?php echo $datos[7] ?? 0 ?>,
<?php echo $datos[8] ?? 0 ?>
],
}]
};

new Chart(document.getElementById('grafico'), {
type: 'bar',
data: data,
options: {
    responsive: true,
    maintainAspectRatio: false,
}
});

</script>

</body>
</html>
window.renderLawyerChart = function (stats) {
  const data = [
    { name: "New / Unreviewed", value: stats.new },
    { name: "In Progress", value: stats.inProgress },
    { name: "Nearing Resolution", value: stats.nearing }
  ];

  ApexCharts.exec("sales-overview", "updateSeries", [
    {
      name: "Cases",
      data: data.map(d => d.value)
    }
  ]);
}

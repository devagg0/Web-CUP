import api from './api';

export async function getResumenReportesAcademicos() {
  const response = await api.get('/admin/reportes-academicos/resumen');
  return response.data;
}

const tipoReporteEndpoints = {
  lista_general_postulantes: '/admin/reportes-academicos/lista-general-postulantes',
  postulantes_aprobados: '/admin/reportes-academicos/postulantes-aprobados',
  postulantes_reprobados: '/admin/reportes-academicos/postulantes-reprobados',
  promedios_generales: '/admin/reportes-academicos/promedios-generales',
  grupos_habilitados: '/admin/reportes-academicos/grupos-habilitados',
  estadisticas_materia: '/admin/reportes-academicos/estadisticas-materia',
  docentes_por_grupo: '/admin/reportes-academicos/docentes-por-grupo',
  grupos_mayor_aprobados: '/admin/reportes-academicos/grupos-mayor-aprobados',
};

export async function getReporteAcademico(tipoReporte, params = {}) {
  const endpoint = tipoReporteEndpoints[tipoReporte];
  if (!endpoint) {
    throw new Error(`Tipo de reporte "${tipoReporte}" no configurado.`);
  }
  const response = await api.get(endpoint, { params });
  return response.data;
}

export async function exportarReporteAcademicoPdf(tipoReporte, params = {}) {
  const response = await api.get('/admin/reportes-academicos/exportar-pdf', {
    params: { ...params, tipo_reporte: tipoReporte },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  
  // Try to download the file dynamically
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reporte_${tipoReporte}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  
  // Clean up URL
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);

  return true;
}

export default {
  getResumenReportesAcademicos,
  getReporteAcademico,
  exportarReporteAcademicoPdf,
};

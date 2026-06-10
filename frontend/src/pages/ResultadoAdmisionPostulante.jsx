import React, { useState, useEffect } from 'react';
import { RefreshCcw, Printer, User, GraduationCap } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import EstadoResultadoAdmisionBadge from '../components/EstadoResultadoAdmisionBadge';
import { getMiResultadoAdmision } from '../services/resultadoAdmision';
import '../styles/resultadoAdmision.css';

export default function ResultadoAdmisionPostulante() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMiResultadoAdmision();
      setData(res);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Error al cargar el resultado de admisión.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Header title="Resultado final de admisión" breadcrumb="Postulante / Resultado de admisión" />
          <div className="content-inner">
            <div className="table-loading">Cargando resultado de admisión...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Header title="Resultado final de admisión" breadcrumb="Postulante / Resultado de admisión" />
          <div className="content-inner">
            <div className="message error">{error}</div>
            <button className="btn-primary" onClick={loadData} style={{ marginTop: '16px' }}>
              <RefreshCcw size={16} /> Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { postulante, resultado, carreras, mensaje } = data || {};
  const estadoClase = resultado?.estado_admision?.toLowerCase() || 'pendiente';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Este header se oculta en la impresión */}
        <Header title="Resultado final de admisión" breadcrumb="Postulante / Resultado de admisión" />

        <div className="content-inner">
          <div className="resultado-container">

            {/* Cabecera formal que solo aparecerá en la impresión */}
            <div className="resultado-print-header">
              <h1>SISTEMA DE ADMISIÓN CUP</h1>
              <p>Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM</p>
              <p style={{ fontWeight: 'bold', marginTop: '6px' }}>COMPROBANTE OFICIAL DE RESULTADO DE ADMISIÓN</p>
            </div>

            <div className="resultado-header">
              <h2>Resultado final de admisión</h2>
              <p>Consulta el resultado oficial de tu admisión al CUP según promedio, ranking y cupos disponibles.</p>
            </div>

            {/* Card Principal con el Estado y Mensaje */}
            <div className={`resultado-card-main ${estadoClase}`}>
              <EstadoResultadoAdmisionBadge estado={resultado?.estado_admision} />
              <p className="resultado-mensaje">"{mensaje}"</p>

              {/* Estadísticas rápidas en la Card */}
              <div className="resultado-stats">
                <div className="resultado-stat-box">
                  <span className="resultado-stat-label">Promedio Final</span>
                  <span className="resultado-stat-value">
                    {resultado?.promedio_final_cup !== null && resultado?.promedio_final_cup !== undefined
                      ? Number(resultado.promedio_final_cup).toFixed(2)
                      : '-'}
                  </span>
                </div>
                <div className="resultado-stat-box">
                  <span className="resultado-stat-label">Estado Académico</span>
                  <span className="resultado-stat-value" style={{ color: resultado?.estado_academico_cup === 'APROBADO' ? '#15803d' : resultado?.estado_academico_cup === 'REPROBADO' ? '#b91c1c' : '#475569' }}>
                    {resultado?.estado_academico_cup ?? '-'}
                  </span>
                </div>
                <div className="resultado-stat-box">
                  <span className="resultado-stat-label">Ranking CUP</span>
                  <span className="resultado-stat-value">
                    {resultado?.posicion_ranking ?? '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Carreras Elegidas y Asignada */}
            <div className="resultado-details-section">
              <h3 className="resultado-section-title">
                <GraduationCap size={18} />
                <span>Carreras y Preferencias</span>
              </h3>
              <div className="resultado-grid">
                <div className="resultado-info-item">
                  <span className="resultado-label">1ra Carrera Elegida</span>
                  <span className="resultado-value">{carreras?.primera_carrera?.nombre ?? 'Sin carrera'}</span>
                </div>
                <div className="resultado-info-item">
                  <span className="resultado-label">2da Carrera Elegida</span>
                  <span className="resultado-value">{carreras?.segunda_carrera?.nombre ?? 'Sin carrera'}</span>
                </div>
                <div className="resultado-info-item full-width" style={{ marginTop: '8px' }}>
                  <span className="resultado-label">Carrera Asignada</span>
                  <span className="resultado-value highlight" style={{ fontSize: '18px', color: '#003B73' }}>
                    {carreras?.carrera_asignada?.nombre ?? 'Sin carrera asignada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos Personales del Postulante */}
            <div className="resultado-details-section">
              <h3 className="resultado-section-title">
                <User size={18} />
                <span>Datos del Postulante</span>
              </h3>
              <div className="resultado-grid">
                <div className="resultado-info-item">
                  <span className="resultado-label">Nombres y Apellidos</span>
                  <span className="resultado-value">{postulante?.nombre_completo ?? 'Sin nombre'}</span>
                </div>
                <div className="resultado-info-item">
                  <span className="resultado-label">Cédula de Identidad (CI)</span>
                  <span className="resultado-value">{postulante?.ci ?? 'Sin CI'}</span>
                </div>
                <div className="resultado-info-item">
                  <span className="resultado-label">Correo Electrónico</span>
                  <span className="resultado-value">{postulante?.correo ?? 'Sin correo'}</span>
                </div>
                <div className="resultado-info-item">
                  <span className="resultado-label">Fecha Procesamiento</span>
                  <span className="resultado-value">{resultado?.fecha_procesamiento ?? '-'}</span>
                </div>
                <div className="resultado-info-item full-width">
                  <span className="resultado-label">Observaciones</span>
                  <span className="resultado-value observacion">{resultado?.observacion ?? 'Sin observaciones registradas.'}</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="resultado-actions">
              <button className="btn-secondary" onClick={loadData}>
                <RefreshCcw size={16} /> Actualizar
              </button>
              <button className="btn-primary" onClick={handlePrint} style={{ backgroundColor: '#003B73' }}>
                <Printer size={16} /> Imprimir resultado
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

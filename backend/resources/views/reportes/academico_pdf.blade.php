<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #003B73;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-title {
            font-size: 18px;
            font-weight: bold;
            color: #003B73;
            margin: 0;
        }
        .header-subtitle {
            font-size: 13px;
            color: #555;
            margin: 5px 0 0 0;
            text-transform: uppercase;
        }
        .header-meta {
            text-align: right;
            font-size: 10px;
            color: #666;
        }
        .filters-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 15px;
        }
        .filters-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
            color: #475569;
        }
        .filters-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .filters-list li {
            display: inline-block;
            margin-right: 15px;
            font-size: 10px;
            color: #64748b;
        }
        .summary-cards {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .summary-card {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: center;
            border-radius: 4px;
        }
        .summary-value {
            font-size: 14px;
            font-weight: bold;
            color: #003B73;
        }
        .summary-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 2px;
        }
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
        }
        .report-table th {
            background-color: #003B73;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #00264d;
        }
        .report-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .report-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            color: #fff;
            text-align: center;
        }
        .badge-success { background-color: #16a34a; }
        .badge-warning { background-color: #d97706; }
        .badge-danger { background-color: #dc2626; }
        .badge-info { background-color: #2563eb; }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }
        .page-break {
            page-break-after: always;
        }
        .sub-section-title {
            font-size: 13px;
            font-weight: bold;
            color: #003B73;
            margin: 15px 0 8px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
        }
    </style>
</head>
<body>

    <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    <h1 class="header-title">Sistema CUP FICCT - UAGRM</h1>
                    <h2 class="header-subtitle">{{ $title }}</h2>
                </td>
                <td class="header-meta">
                    <strong>Fecha:</strong> {{ $fecha }}<br>
                    <strong>Usuario:</strong> {{ $usuario }}
                </td>
            </tr>
        </table>
    </div>

    @if(!empty($filtros) && count(array_filter($filtros)) > 0)
        <div class="filters-box">
            <div class="filters-title">Filtros aplicados:</div>
            <ul class="filters-list">
                @if(!empty($filtros['search']))
                    <li><strong>Búsqueda:</strong> "{{ $filtros['search'] }}"</li>
                @endif
                @if(!empty($filtros['grupo_id']))
                    <li><strong>ID Grupo:</strong> {{ $filtros['grupo_id'] }}</li>
                @endif
                @if(!empty($filtros['materia_id']))
                    <li><strong>ID Materia:</strong> {{ $filtros['materia_id'] }}</li>
                @endif
                @if(!empty($filtros['carrera_id']))
                    <li><strong>ID Carrera:</strong> {{ $filtros['carrera_id'] }}</li>
                @endif
                @if(!empty($filtros['estado_admision']))
                    <li><strong>Estado Admisión:</strong> {{ $filtros['estado_admision'] }}</li>
                @endif
            </ul>
        </div>
    @endif

    <!-- REPORTE 1: LISTA GENERAL DE POSTULANTES -->
    @if ($tipo === 'lista_general_postulantes')
        <table class="report-table">
            <thead>
                <tr>
                    <th>CI</th>
                    <th>Nombre Completo</th>
                    <th>Correo</th>
                    <th>Primera Opción</th>
                    <th>Segunda Opción</th>
                    <th>Estado Preins.</th>
                    <th>Grupo</th>
                    <th>Fecha Inscr.</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td>{{ $row['ci'] }}</td>
                        <td>{{ $row['nombre_completo'] }}</td>
                        <td>{{ $row['correo'] }}</td>
                        <td>{{ $row['primera_carrera'] }}</td>
                        <td>{{ $row['segunda_carrera'] }}</td>
                        <td>
                            @if($row['estado'] === 'INSCRITO')
                                <span class="badge badge-success">INSCRITO</span>
                            @elseif(str_contains($row['estado'], 'OBSERVADO'))
                                <span class="badge badge-warning">OBSERVADO</span>
                            @elseif($row['estado'] === 'RECHAZADO')
                                <span class="badge badge-danger">RECHAZADO</span>
                            @else
                                <span class="badge badge-info">{{ $row['estado'] }}</span>
                            @endif
                        </td>
                        <td>{{ $row['grupo_asignado'] }}</td>
                        <td>{{ $row['fecha_inscripcion'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 2: POSTULANTES APROBADOS -->
    @elseif ($tipo === 'postulantes_aprobados')
        <table class="report-table">
            <thead>
                <tr>
                    <th>Rnk</th>
                    <th>CI</th>
                    <th>Nombre Completo</th>
                    <th>Promedio Final</th>
                    <th>Primera Carrera</th>
                    <th>Segunda Carrera</th>
                    <th>Carrera Asignada</th>
                    <th>Estado Admisión</th>
                    <th>Grupo</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td style="font-weight: bold; text-align: center;">{{ $row['ranking'] }}</td>
                        <td>{{ $row['ci'] }}</td>
                        <td>{{ $row['nombre_completo'] }}</td>
                        <td style="font-weight: bold; text-align: right;">{{ number_format($row['promedio_final_cup'], 2) }}</td>
                        <td>{{ $row['primera_carrera'] }}</td>
                        <td>{{ $row['segunda_carrera'] }}</td>
                        <td style="font-weight: bold; color: #003B73;">{{ $row['carrera_asignada'] }}</td>
                        <td>
                            @if(str_contains($row['estado_admision'], 'PRIMERA'))
                                <span class="badge badge-success">ADMITIDO 1ra</span>
                            @elseif(str_contains($row['estado_admision'], 'SEGUNDA'))
                                <span class="badge badge-success">ADMITIDO 2da</span>
                            @else
                                <span class="badge badge-warning">APROBADO SIN CUPO</span>
                            @endif
                        </td>
                        <td>{{ $row['grupo'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 3: POSTULANTES REPROBADOS -->
    @elseif ($tipo === 'postulantes_reprobados')
        <table class="report-table">
            <thead>
                <tr>
                    <th>CI</th>
                    <th>Nombre Completo</th>
                    <th>Promedio Final</th>
                    <th style="width: 40%;">Materias Reprobadas</th>
                    <th>Grupo</th>
                    <th>Estado Admisión</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td>{{ $row['ci'] }}</td>
                        <td>{{ $row['nombre_completo'] }}</td>
                        <td style="font-weight: bold; text-align: right;">{{ number_format($row['promedio_final_cup'], 2) }}</td>
                        <td style="color: #dc2626;">{{ $row['materias_reprobadas'] }}</td>
                        <td>{{ $row['grupo'] }}</td>
                        <td><span class="badge badge-danger">REPROBADO</span></td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 4: PROMEDIOS GENERALES -->
    @elseif ($tipo === 'promedios_generales')
        <table class="report-table" style="width: 50%; margin-left: auto; margin-right: auto;">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th style="text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Promedio General CUP</strong></td>
                    <td style="text-align: right; font-weight: bold; font-size: 12px; color: #003B73;">{{ number_format($data['promedio_general_cup'], 2) }}</td>
                </tr>
                <tr>
                    <td>Promedio Más Alto</td>
                    <td style="text-align: right; font-weight: bold;">{{ number_format($data['promedio_mas_alto'], 2) }}</td>
                </tr>
                <tr>
                    <td>Promedio Más Bajo</td>
                    <td style="text-align: right; font-weight: bold;">{{ number_format($data['promedio_mas_bajo'], 2) }}</td>
                </tr>
                <tr>
                    <td>Total Estudiantes Evaluados</td>
                    <td style="text-align: right;">{{ $data['total_evaluados'] }}</td>
                </tr>
                <tr>
                    <td>Total Aprobados Académicos</td>
                    <td style="text-align: right; color: #16a34a; font-weight: bold;">{{ $data['total_aprobados'] }}</td>
                </tr>
                <tr>
                    <td>Total Reprobados Académicos</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">{{ $data['total_reprobados'] }}</td>
                </tr>
                <tr>
                    <td>Total Pendientes de Calificación</td>
                    <td style="text-align: right; color: #d97706;">{{ $data['total_pendientes'] }}</td>
                </tr>
            </tbody>
        </table>

        <div class="page-break"></div>

        <div class="sub-section-title">Promedios y Estados por Grupo</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th>Promedio Grupo</th>
                    <th>Aprobados</th>
                    <th>Reprobados</th>
                    <th>Pendientes</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data['grupos'] as $g)
                    <tr>
                        <td style="font-weight: bold;">{{ $g['grupo'] }}</td>
                        <td style="text-align: right; font-weight: bold;">{{ number_format($g['promedio_grupo'], 2) }}</td>
                        <td style="color: #16a34a; font-weight: bold;">{{ $g['aprobados'] }}</td>
                        <td style="color: #dc2626; font-weight: bold;">{{ $g['reprobados'] }}</td>
                        <td>{{ $g['pendientes'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center;">No hay datos de grupos.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="sub-section-title">Promedios y Admisión por Carrera</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Carrera</th>
                    <th>Promedio Asignados</th>
                    <th>Admitidos</th>
                    <th>Aprobados Sin Cupo</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data['carreras'] as $c)
                    <tr>
                        <td style="font-weight: bold;">{{ $c['carrera'] }}</td>
                        <td style="text-align: right; font-weight: bold;">{{ number_format($c['promedio'], 2) }}</td>
                        <td style="color: #16a34a; font-weight: bold;">{{ $c['admitidos'] }}</td>
                        <td style="color: #d97706; font-weight: bold;">{{ $c['aprobados_sin_cupo'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center;">No hay datos de carreras.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 5: CANTIDAD DE GRUPOS HABILITADOS -->
    @elseif ($tipo === 'grupos_habilitados')
        @if(!empty($resumenGrupos))
            <table class="summary-cards" style="width: 80%; margin-left: auto; margin-right: auto;">
                <tr>
                    <td style="width: 25%; padding: 5px;">
                        <div class="summary-card">
                            <div class="summary-value">{{ $resumenGrupos['total_grupos_habilitados'] }}</div>
                            <div class="summary-label">Grupos Activos</div>
                        </div>
                    </td>
                    <td style="width: 25%; padding: 5px;">
                        <div class="summary-card">
                            <div class="summary-value">{{ $resumenGrupos['total_grupos'] }}</div>
                            <div class="summary-label">Total Grupos</div>
                        </div>
                    </td>
                    <td style="width: 25%; padding: 5px;">
                        <div class="summary-card">
                            <div class="summary-value">{{ $resumenGrupos['total_estudiantes_asignados'] }}</div>
                            <div class="summary-label">Estud. Asignados</div>
                        </div>
                    </td>
                    <td style="width: 25%; padding: 5px;">
                        <div class="summary-card">
                            <div class="summary-value">{{ $resumenGrupos['capacidad_total'] }}</div>
                            <div class="summary-label">Capacidad Total</div>
                        </div>
                    </td>
                </tr>
            </table>
        @endif

        <table class="report-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre Grupo</th>
                    <th>Capacidad Máxima</th>
                    <th>Estudiantes Asignados</th>
                    <th>Estado</th>
                    <th>Fecha de Creación</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td style="font-weight: bold;">{{ $row['codigo'] }}</td>
                        <td>{{ $row['nombre'] }}</td>
                        <td style="text-align: right;">{{ $row['capacidad_maxima'] }}</td>
                        <td style="text-align: right; font-weight: bold; color: #003B73;">{{ $row['estudiantes_asignados'] }}</td>
                        <td>
                            @if($row['estado'] === 'ACTIVO')
                                <span class="badge badge-success">ACTIVO</span>
                            @else
                                <span class="badge badge-danger">INACTIVO</span>
                            @endif
                        </td>
                        <td>{{ $row['fecha_creacion'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 6: ESTADÍSTICAS POR MATERIA -->
    @elseif ($tipo === 'estadisticas_materia')
        <table class="report-table">
            <thead>
                <tr>
                    <th>Materia</th>
                    <th style="text-align: right;">Evaluados</th>
                    <th style="text-align: right;">Aprobados</th>
                    <th style="text-align: right;">Reprobados</th>
                    <th style="text-align: right;">Pendientes</th>
                    <th style="text-align: right;">Promedio</th>
                    <th style="text-align: right;">Nota Máx</th>
                    <th style="text-align: right;">Nota Mín</th>
                    <th style="text-align: right;">% Aprobación</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td style="font-weight: bold;">{{ $row['materia'] }}</td>
                        <td style="text-align: right;">{{ $row['evaluados'] }}</td>
                        <td style="text-align: right; color: #16a34a; font-weight: bold;">{{ $row['aprobados'] }}</td>
                        <td style="text-align: right; color: #dc2626; font-weight: bold;">{{ $row['reprobados'] }}</td>
                        <td style="text-align: right; color: #d97706;">{{ $row['pendientes'] }}</td>
                        <td style="text-align: right; font-weight: bold;">{{ number_format($row['promedio_materia'], 2) }}</td>
                        <td style="text-align: right;">{{ number_format($row['nota_maxima'], 2) }}</td>
                        <td style="text-align: right;">{{ number_format($row['nota_minima'], 2) }}</td>
                        <td style="text-align: right; font-weight: bold; color: #003B73;">{{ number_format($row['porcentaje_aprobacion'], 2) }}%</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 7: DOCENTES POR GRUPOS -->
    @elseif ($tipo === 'docentes_por_grupo')
        <table class="report-table">
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th>Materia</th>
                    <th>Docente</th>
                    <th>Correo</th>
                    <th>Aula</th>
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Turno</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $row)
                    <tr>
                        <td style="font-weight: bold;">{{ $row['grupo'] }}</td>
                        <td>{{ $row['materia'] }}</td>
                        <td style="font-weight: bold;">{{ $row['docente'] }}</td>
                        <td>{{ $row['correo_docente'] }}</td>
                        <td>{{ $row['aula'] }}</td>
                        <td>{{ $row['dia'] }}</td>
                        <td style="text-align: center;">
                            @if($row['hora_inicio'] !== 'Sin asignar')
                                {{ substr($row['hora_inicio'], 0, 5) }} - {{ substr($row['hora_fin'], 0, 5) }}
                            @else
                                Sin asignar
                            @endif
                        </td>
                        <td>{{ $row['turno'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    <!-- REPORTE 8: GRUPOS CON MAYOR CANTIDAD DE APROBADOS -->
    @elseif ($tipo === 'grupos_mayor_aprobados')
        <table class="report-table">
            <thead>
                <tr>
                    <th>Rank.</th>
                    <th>Grupo</th>
                    <th style="text-align: right;">Total Estudiantes</th>
                    <th style="text-align: right;">Aprobados</th>
                    <th style="text-align: right;">Reprobados</th>
                    <th style="text-align: right;">Pendientes</th>
                    <th style="text-align: right;">% Aprobación</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $index => $row)
                    <tr>
                        <td style="text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
                        <td style="font-weight: bold;">{{ $row['grupo'] }}</td>
                        <td style="text-align: right;">{{ $row['total_estudiantes'] }}</td>
                        <td style="text-align: right; color: #16a34a; font-weight: bold;">{{ $row['aprobados'] }}</td>
                        <td style="text-align: right; color: #dc2626;">{{ $row['reprobados'] }}</td>
                        <td style="text-align: right; color: #d97706;">{{ $row['pendientes'] }}</td>
                        <td style="text-align: right; font-weight: bold; color: #003B73;">{{ number_format($row['porcentaje_aprobacion'], 2) }}%</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" style="text-align: center;">No hay datos disponibles para este reporte.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @endif

    <div class="footer">
        Reporte generado automáticamente por el Sistema CUP - UAGRM
    </div>

</body>
</html>

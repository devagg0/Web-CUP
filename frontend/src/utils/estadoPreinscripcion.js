const ESTADOS = {
  EN_REVISION_REQUISITOS: {
    key: 'EN_REVISION_REQUISITOS',
    label: 'En revisión de requisitos',
    color: 'info',
  },
  REQUISITOS_OBSERVADOS: {
    key: 'REQUISITOS_OBSERVADOS',
    label: 'Requisitos observados',
    color: 'warning',
  },
  PAGO_HABILITADO: {
    key: 'PAGO_HABILITADO',
    label: 'Pago habilitado',
    color: 'success',
  },
  PAGO_EN_REVISION: {
    key: 'PAGO_EN_REVISION',
    label: 'Pago en revisión',
    color: 'info',
  },
  PAGO_OBSERVADO: {
    key: 'PAGO_OBSERVADO',
    label: 'Pago observado',
    color: 'warning',
  },
  INSCRITO: {
    key: 'INSCRITO',
    label: 'Inscrito',
    color: 'success',
  },
  RECHAZADO: {
    key: 'RECHAZADO',
    label: 'Rechazado',
    color: 'danger',
  },
};

const ALL_ESTADOS = Object.keys(ESTADOS);

export { ESTADOS, ALL_ESTADOS };

export default ESTADOS;

import { saveSuscriptionPreaproval } from '@/app/api/FetchPayments';
import React, { useEffect, useRef } from 'react';
const MP_PUB_KEY = process.env.NEXT_PUBLIC_MP_PUB_KEY;

/*
** Componente que se encarga de renderizar el formulario de pago de MercadoPago
** No ejecuta ningun pago por si solo
** Solo manda al BE para generar la suscripcion
*/


function CardPaymentBrickReact({ suscription, planId, userLoged, onExecution }) {

  const handleApprobeReject = async (status, paymentId) => {
    onExecution(status, paymentId);
  };

  useEffect(() => {
    initMercadoPago(MP_PUB_KEY);
  }, []);

  const initialization = {
    amount: suscription.amount,
  };

  const onSubmit = async (formData) => {
    try {
      const userString = JSON.stringify(userLoged);
      const approbe = await saveSuscriptionPreaproval(suscription.amount, planId, userString, formData);
      if (approbe.status !== 200) {
        throw new Error('Error al aprobar la suscripción');
      }
      handleApprobeReject(true, approbe.data.id);
    } catch (error) {
      console.log('Error en la transacción', error);
      handleApprobeReject(false, null);
      return false;
    }
  };

  const onError = (error) => {
    handleApprobeReject(false, null);
      return false;
  };

  // Función que se llama cuando el Brick está listo
  const onReady = () => {
    console.log('Brick listo');
  };

  return (
    <div>
      <CardPayment
        initialization={initialization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
};

export default CardPaymentBrickReact;


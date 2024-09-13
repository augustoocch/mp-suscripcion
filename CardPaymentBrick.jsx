import { saveSuscriptionPreaproval } from '@/app/api/FetchPayments';
import React, { useEffect, useRef } from 'react';
const MP_PUB_KEY = process.env.NEXT_PUBLIC_MP_PUB_KEY;

/*
** Componente que se encarga de renderizar el formulario de pago de MercadoPago
** No ejecuta ningun pago por si solo
** Solo manda al BE para generar la suscripcion
*/

function CardPaymentBrick({ suscription, planId, userLoged, onExecution }) {
  const initialFetchRef = useRef(false);

  const handleApprobeReject = async (status, paymentId) => {
    onExecution(status, paymentId);
  };

  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      const loadMercadoPago = async () => {
        if (!window.MercadoPago) {
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = () => {
            createPaymentBrick();
          };
          document.body.appendChild(script);
        } else {
          createPaymentBrick();
        }
      };

      const createPaymentBrick = async () => {
        const mp = new MercadoPago(MP_PUB_KEY, { locale: 'es-AR' });
        const bricksBuilder = mp.bricks();
        const settings = {
          initialization: {
            amount: suscription.amount,
            payer: {
              firstName: userLoged.name,
              lastName: userLoged.surname,
              email: userLoged.auth.email,
            },
          },
          customization: {
            visual: {
              style: {
                customVariables: {
                  theme: 'default',
                }
              }
            },
            paymentMethods: {
              maxInstallments: 1,
            }
          },
          callbacks: {
            onReady: async () => {
            },
            onSubmit: async (cardFormData) => {
              try {
                const userString = JSON.stringify(userLoged);
                const approbe = await saveSuscriptionPreaproval(suscription.amount, planId, userString, cardFormData);
                if (approbe.status !== 200) {
                  throw new Error('Error al aprobar la suscripción');
                }
                handleApprobeReject(true, approbe.data.id);
              } catch (error) {
                console.log('Error en la transacción', error);
                handleApprobeReject(false, null);
                return false;
              }
            },
            onError: (error) => {
              console.log('Error en la transacción', error);
              handleApprobeReject(false, null);
              return false;
            },
          },
        };
        window.cardPaymentBrickController = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', settings);
      };

      const initialize = async () => {
        await loadMercadoPago();
      };

      initialize();
    }
  }, [planId, userLoged]);

  return <div id="cardPaymentBrick_container"></div>;
};

export default CardPaymentBrick;


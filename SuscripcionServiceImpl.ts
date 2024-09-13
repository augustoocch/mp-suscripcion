
/*
** Finalmente se implementa la clase SuscriptionServiceImpl que extiende de la clase abstracta SuscriptionService.
** En esta clase se implementa el método preapprobeSuscripcion que se encarga de preaprobar una suscripcion.
** Para ello se hace uso de la función preapproveSuscription que se encarga de realizar la petición a la API de Mercado Pago.
** En caso de que la petición sea exitosa, se almacena el usuario suscrito en la base de datos.
** Si la suscripción es habilitada, se retorna true.
*/


@Injectable()
export class SuscriptionServiceImpl extends SuscriptionService {

    async preapprobeSuscripcion(request: MeliSuscriptionPreapprobalRequest): Promise<Boolean> {
        console.log("Preaprobando suscripcion ---->", request.data);
        try {
            const responseObject: MeliSuscriptionResponse = await this.preapproveSuscription(request);
            console.log("Respuesta de la suscripcion ---->", responseObject);
            if(parseInt(responseObject.status) === 500){
                throw new PaymentException(ErrorCode.ERROR_CREATING_SUSCRIPTION, ErrorMessage.ERROR_CREATING_SUSCRIPTION, 500);
            }
            await this.saveUserSuscribed(responseObject, request.planId);
            if (PaymentConstants.STATUS_SUSCRIPCION_HABILITADOS.includes(responseObject.status)) {
                return true;
            }
        } catch (error) {
            console.error("Error creando la suscripcion: ", error);
            throw error;
        }
    }

    private async preapproveSuscription(request: MeliSuscriptionPreapprobalRequest): Promise<MeliSuscriptionResponse> {
        const UUID = await this.createUniqueUUID()
        const startDate = new Date().toISOString();
        const futureYear = new Date().getFullYear() + 2;
        const endDate = new Date(startDate);
        endDate.setFullYear(futureYear);
        const formattedEndDate = endDate.toISOString();
        try {
            const response = await fetch(SUSCRIPTION_PREAPPROVAL, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: this.getSuscriptionPreapprobalBody(request, UUID, startDate, formattedEndDate)
            });
            const responseObject: MeliSuscriptionResponse = await response.json();
            responseObject.usr_email = request.data.email;
            return responseObject;
        } catch (error) {
            console.error("Error creando el modelo de usuario suscrito: ", error);
            throw error;
        }
    }


    private async createUniqueUUID(): Promise<string> {
        let uuid: string;
        do {
            uuid = uuidv4();
        } while (await SuscribedUser.findOne({ where: { id_suscription: uuid } }));

        return uuid;
    }


    private getPlanBody(plan: PaymentPlan) {
        return JSON.stringify({
            "reason": PaymentConstants.REASON.concat(" " + plan.title),
            "auto_recurring": {
                "frequency": PaymentConstants.FREQUENCY,
                "frequency_type": PaymentConstants.FREQUENCY_TYPE,
                "billing_day": PaymentConstants.BILLING_DAY,
                "billing_day_proportional": true,
                "transaction_amount": plan.amount,
                "currency_id": PaymentConstants.CURRENCY_ID
            },
            "payment_methods_allowed": {
                "payment_types": [
                    {}
                ],
                "payment_methods": [
                    {}
                ]
            },
            "back_url": "https://www.handy.com"
        })
    }

    private getSuscriptionPreapprobalBody(request: MeliSuscriptionPreapprobalRequest
        , UUID: string, startDate: string, formattedEndDate: string) {
        return JSON.stringify({
            "preapproval_plan_id": request.planId,
            "reason": PaymentConstants.REASON,
            "external_reference": UUID,
            "payer_email": request.data.email,
            "card_token_id": request.data.token,
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": PaymentConstants.FRECUENCY_M,
                "start_date": startDate,
                "end_date": formattedEndDate,
                "transaction_amount": request.amount,
                "currency_id": PaymentConstants.CURRENCY_ARS
            },
            "back_url": "https://www.handy.com/home",
            "status": "authorized",
        })
    }
}

/*
**
** Esto lo que hace es enviar la data a mi BE que maneja los pagos
**
*/
export async function saveSuscriptionPreaproval(amount: number, planId: string, userString: string, cardFormData: any) {
    try {
        const usrLoged: UserLoged = JSON.parse(userString);
        const email = usrLoged?.auth!.email!;
        const reqToObject: MeliSuscriptionPreapprobalRequest = new MeliSuscriptionPreapprobalRequest(
            email, cardFormData.token, planId, amount
        );
        const response: Response = await fetch(GATEWAY_ENDPOINT_GENERAL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + 'tu token'
            },
            body: JSON.stringify({
                payload: reqToObject
            })
        });
        const responseObject: ObjectResponse = await response.json();
        console.log("End of suscription preapproval ------*");
        return responseObject;
    } catch (ex) {
        console.log(ex);
        throw new HandyException(ErrorCode.ERROR_CREATING_SUSCRIPTION,
            ErrorMessage.ERROR_CREATING_SUSCRIPTION, 500);
    }
}

export const handleSuccessfulCharge = (charge_id: string): void => {
	console.log(
		`Charge ${charge_id} was successful handling from redis and updating database and giving user his product`
	);
};

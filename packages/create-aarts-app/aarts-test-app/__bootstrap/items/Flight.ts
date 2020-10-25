export class Flight {
    constructor(...args: any[]) { }
    public airplane?: string
    public from_airport?: string
    public to_airport?: string
    public from_country?: string
    public to_country?: string
    public flight_code?: string
    public duration_hours?: number
    public tourist_season?: string
    public price_1st_class?: number
    public price_2nd_class?: number
    public price_vip?: number
}
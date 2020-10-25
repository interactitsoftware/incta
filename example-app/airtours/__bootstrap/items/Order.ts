export class Order {
    constructor(...args: any[]) { }
    public invoice?: string
    public flight?: string
    public tourist_season?: string
    public price?: number
    public quantity?: number
    public discount?: number
    public vat?: number
}
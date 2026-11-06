export interface MenuNode { route_key: string; label: string; icon?: string; permission?: string; children?: MenuNode[] }
export interface BookingTypeDef { code: string; label: string; icon?: string; flow: string; form_schema: unknown }
export interface Bootstrap { config_version: number; menus: MenuNode[]; booking_types: BookingTypeDef[] }

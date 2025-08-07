export enum UserRole {
    Customer = 1,
    EventManager = 2,
    Admin = 0
}

export const getRoleDisplayName = (role: number): string => {
    switch (role) {
        case UserRole.Customer:
            return 'Customer';
        case UserRole.EventManager:
            return 'Event Manager';
        case UserRole.Admin:
            return 'Admin';
        default:
            return 'Unknown';
    }
};

export const getRoleBadgeVariant = (role: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
        case UserRole.Customer:
            return 'default';
        case UserRole.EventManager:
            return 'secondary';
        case UserRole.Admin:
            return 'destructive';
        default:
            return 'outline';
    }
};

export const getRoleColor = (role: number): string => {
    switch (role) {
        case UserRole.Customer:
            return 'bg-blue-500 text-white';
        case UserRole.EventManager:
            return 'bg-green-500 text-white';
        case UserRole.Admin:
            return 'bg-red-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

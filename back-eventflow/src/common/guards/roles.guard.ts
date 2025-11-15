import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        try {
            const requiredRoles = this.reflector?.get<string[]>(
                'roles',
                context.getHandler(),
            );

            if (!requiredRoles || requiredRoles.length === 0) {
                return true;
            }

            const request = context.switchToHttp().getRequest();
            const user = request?.user;

            if (!user || !user.role) {
                return false;
            }

            return requiredRoles.includes(user.role);
        } catch (error) {
            console.error('Error in RolesGuard:', error);
            return false;
        }
    }
}
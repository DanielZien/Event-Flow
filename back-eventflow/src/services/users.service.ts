import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { User } from "src/interfaces/user.interface";
import { UserRole } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import { UserFilterDto } from "src/users/dto/user-filter.dto";
import { UpdateUserDto } from "src/users/dto/update-user.dto";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { SelfUpdateUserDto } from "src/users/dto/self-update.user.dto";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService){}

    async findAll(filters: UserFilterDto) {
        return this.prisma.user.findMany();
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({where: {email: email}});
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
                telefone: true,
                imagem: true,
                participando: true,
                eventsCreated: true,
            }
        });
    }

    async create(userData: User){
        const registered = await this.findByEmail(userData.email);
        if(registered){
            throw new ConflictException('Email já cadastrado');
        }
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        return this.prisma.user.create({data: {...userData, role: UserRole.USER, password: hashedPassword}})
    }

    async update(id: number, userData: UpdateUserDto | SelfUpdateUserDto){
      if (!(userData instanceof UpdateUserDto) && 'role' in userData){
        throw new UnauthorizedException('Acesso negado, permissão insuficiente');
      }
        return this.prisma.user.update({where: {id}, data: userData, select: {
          id: true,
          email: true,
          nome: true,
          telefone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          imagem: true
        },});
    }

    async delete(id: number){
        return this.prisma.user.delete({where: {id}});
    }

    async getUserEvents(userId: number) {
        return this.prisma.event.findMany({
          where: { 
            creatorId: userId,
            ativo: true 
          },
          include: {
            _count: {
              select: {
                participantes: {
                  where: {
                    status: 'CONFIRMADO',
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
}
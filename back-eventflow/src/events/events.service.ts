import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { EventFilter } from "src/interfaces/event.interface";

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(eventData: any, id: number) {
        eventData.createdAt = new Date();
        eventData.ativo = true
        return this.prisma.event.create({
            data: {
                ...eventData,
                creatorId: id
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        nome: true,
                        telefone: true
                    }
                }
            }
        })
    }


    async findAll(filter: EventFilter) {
        const where: any = { ativo: true };
        
        if(filter.categoria){
            where.categoria = filter.categoria
        }
        if (filter.id) {
            where.id = filter.id
        }
        if (filter.titulo) {
            where.titulo = filter.titulo
        }
        if (filter.data) {
            where.data = filter.data
        }
        if (filter.localizacao) {
            where.localizacao = filter.localizacao
        }

        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            this.prisma.event.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true
                        }
                    },
                    _count: {
                        select: {
                            participantes: {
                                where: {
                                    status: 'CONFIRMADO'
                                }
                            }
                        }
                    }
                },
                orderBy: { data: 'asc'},
                skip,
                take: limit
            }),
            this.prisma.event.count({where})
        ]);

        return {
            events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    async findOne(id: number){
        const event = await this.prisma.event.findUnique({
            where: {id},
            include: {
                creator: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefone: true
                    }
                },
                participantes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nome: true,
                                email: true,
                                telefone: true
                            }
                        }
                    }
                }
            }
        })

        if(!event) throw new NotFoundException('Evento nao encontrado');
        return event
    }

    async update(id: number, updateData: any, userId: number){
        const event = await this.findOne(id);

        if (event.creatorId !== userId) throw new ForbiddenException('Acesso negado, permissão insuficiente');

        return this.prisma.event.update({
            where: {id},
            data: updateData,
            include: {
                creator: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefone: true
                    }
                }
            }
        })
    }

    async remove(id: number, userId: number) {
        const event = await this.findOne(id);
        if (event.creatorId !== userId) throw new ForbiddenException('Acesso negado, permissão insuficiente');
        return this.prisma.event.update({where: {id}, data: {ativo: false}}); 
    }
}
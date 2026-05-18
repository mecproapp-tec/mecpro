import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import {
  Prisma,
  EstimateStatus,
  InvoiceStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);
  private readonly pdfGeneratingLocks = new Set<number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly estimatesPdfService: EstimatesPdfService,
    private readonly storageService: StorageService,
  ) {}

  private calculate(items: any[]) {
    let total = new Prisma.Decimal(0);

    const normalizedItems = items.map((item) => {
      const priceValue =
        typeof item.price === 'string'
          ? parseFloat(item.price)
          : item.price;

      const price = new Prisma.Decimal(
        isNaN(priceValue) ? 0 : priceValue,
      );

      const quantity = new Prisma.Decimal(item.quantity || 1);

      const issPercent = new Prisma.Decimal(
        item.issPercent || 0,
      );

      const subtotal = price.times(quantity);

      const tax = subtotal
        .times(issPercent)
        .dividedBy(100);

      const itemTotal = subtotal.plus(tax);

      total = total.plus(itemTotal);

      return {
        description: item.description || '-',
        quantity: quantity.toNumber(),
        price,
        issPercent: issPercent.toNumber(),
        total: itemTotal,
      };
    });

    return {
      items: normalizedItems,
      total,
    };
  }

  async create(tenantId: string, data: any) {
    const {
      clientId,
      items: inputItems,
      date,
    } = data;

    if (!tenantId?.trim()) {
      throw new BadRequestException(
        'Tenant inválido',
      );
    }

    if (!clientId) {
      throw new BadRequestException(
        'Cliente não informado',
      );
    }

    if (!inputItems?.length) {
      throw new BadRequestException(
        'Orçamento sem itens',
      );
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId,
      },
    });

    if (!client) {
      throw new BadRequestException(
        'Cliente não encontrado',
      );
    }

    const { items, total } =
      this.calculate(inputItems);

    const estimateDate = date
      ? new Date(date)
      : new Date();

    try {
      const estimate =
        await this.prisma.estimate.create({
          data: {
            tenantId,
            clientId,
            total,
            status: EstimateStatus.DRAFT,
            date: estimateDate,
            pdfStatus: 'pending',

            items: {
              create: items,
            },
          },

          include: {
            client: true,
            items: true,
            tenant: true,
          },
        });

      return estimate;
    } catch (error: any) {
      this.logger.error(
        `Erro ao criar orçamento`,
        error?.stack || error,
      );

      throw new InternalServerErrorException(
        'Erro ao criar orçamento',
      );
    }
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 50,
  ) {
    const safePage = Math.max(
      1,
      Number(page) || 1,
    );

    const safeLimit = Math.min(
      100,
      Math.max(1, Number(limit) || 50),
    );

    const skip = (safePage - 1) * safeLimit;

    const where = {
      tenantId,
      deletedAt: null,
      status: {
        not: EstimateStatus.CONVERTED,
      },
    };

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.estimate.findMany({
          where,
          skip,
          take: safeLimit,

          include: {
            client: true,
            items: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.estimate.count({
          where,
        }),
      ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findConverted(
    tenantId: string,
    page = 1,
    limit = 50,
  ) {
    const safePage = Math.max(
      1,
      Number(page) || 1,
    );

    const safeLimit = Math.min(
      100,
      Math.max(1, Number(limit) || 50),
    );

    const skip = (safePage - 1) * safeLimit;

    const where = {
      tenantId,
      deletedAt: null,
      status: EstimateStatus.CONVERTED,
    };

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.estimate.findMany({
          where,
          skip,
          take: safeLimit,

          include: {
            client: true,
            items: true,
            invoice: true,
          },

          orderBy: {
            updatedAt: 'desc',
          },
        }),

        this.prisma.estimate.count({
          where,
        }),
      ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(
    id: number,
    tenantId: string,
  ) {
    const estimate =
      await this.prisma.estimate.findFirst({
        where: {
          id,
          tenantId,
          deletedAt: null,
        },

        include: {
          client: true,
          items: true,
          tenant: true,
          invoice: true,
        },
      });

    if (!estimate) {
      throw new NotFoundException(
        'Orçamento não encontrado',
      );
    }

    return estimate;
  }

  async update(
    id: number,
    tenantId: string,
    data: any,
  ) {
    const estimate = await this.findOne(
      id,
      tenantId,
    );

    if (
      estimate.status ===
      EstimateStatus.CONVERTED
    ) {
      throw new BadRequestException(
        'Orçamento convertido não pode ser alterado',
      );
    }

    const {
      clientId,
      items: inputItems,
      date,
      status,
    } = data;

    return this.prisma.$transaction(
      async (tx) => {
        const updateData: any = {};

        if (
          clientId &&
          clientId !== estimate.clientId
        ) {
          const client =
            await tx.client.findFirst({
              where: {
                id: clientId,
                tenantId,
              },
            });

          if (!client) {
            throw new BadRequestException(
              'Cliente inválido',
            );
          }

          updateData.clientId = clientId;
        }

        if (date) {
          updateData.date = new Date(date);
        }

        if (status) {
          updateData.status = status;
        }

        let itemsChanged = false;

        if (
          inputItems &&
          inputItems.length > 0
        ) {
          const { items, total } =
            this.calculate(inputItems);

          await tx.estimateItem.deleteMany({
            where: {
              estimateId: id,
            },
          });

          updateData.items = {
            create: items,
          };

          updateData.total = total;

          itemsChanged = true;
        }

        const updatedEstimate =
          await tx.estimate.update({
            where: {
              id,
            },

            data: updateData,

            include: {
              client: true,
              items: true,
            },
          });

        if (itemsChanged) {
          await tx.estimate.update({
            where: {
              id,
            },

            data: {
              pdfUrl: null,
              pdfKey: null,
              pdfStatus: 'pending',
              pdfGeneratedAt: null,
            },
          });
        }

        return updatedEstimate;
      },
      {
        timeout: 30000,
      },
    );
  }

  /**
   * Converte um orçamento (estimate) em fatura (invoice)
   * @param estimateId - ID do orçamento
   * @param tenantId - ID do tenant
   * @returns Fatura criada
   */
  async convertToInvoice(
    estimateId: number,
    tenantId: string,
  ) {
    this.logger.log(`convertToInvoice ${estimateId}`);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const estimate = await tx.estimate.findFirst({
          where: {
            id: estimateId,
            tenantId,
            deletedAt: null,
          },
          include: {
            items: true,
          },
        });

        if (!estimate) {
          throw new NotFoundException('Orçamento não encontrado');
        }

        if (estimate.status === EstimateStatus.CONVERTED) {
          throw new ConflictException('Orçamento já convertido');
        }

        const existingInvoice = await tx.invoice.findFirst({
          where: { estimateId: estimate.id },
          select: { id: true, number: true },
        });

        if (existingInvoice) {
          throw new ConflictException('Já existe fatura vinculada');
        }

        if (!estimate.items?.length) {
          throw new BadRequestException('Orçamento sem itens');
        }

        const invoiceNumber = await this.generateInvoiceNumber(tx, tenantId);

        const invoice = await tx.invoice.create({
          data: {
            tenantId: estimate.tenantId,
            clientId: estimate.clientId,
            total: estimate.total,
            number: invoiceNumber,
            status: InvoiceStatus.PENDING,
            estimateId: estimate.id,
            pdfStatus: 'pending',
            items: {
              createMany: {
                data: estimate.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total,
                  issPercent: item.issPercent,
                })),
              },
            },
          },
          select: {
            id: true,
            number: true,
          },
        });

        await tx.estimate.update({
          where: { id: estimate.id },
          data: { status: EstimateStatus.CONVERTED },
        });

        return invoice;
      });

      return {
        success: true,
        invoiceId: result.id,
        invoiceNumber: result.number,
        invoice: result,
      };
    } catch (error: any) {
      this.logger.error(`convertToInvoice error ${estimateId}`, error?.stack || error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error?.code === 'P2002') {
        throw new ConflictException('Duplicação detectada');
      }

      throw new InternalServerErrorException('Erro ao converter orçamento');
    }
  }

  /**
   * Gera número único de fatura no formato: ANO-MÊS-SEQUENCIAL
   * Exemplo: 2026-05-000001
   * @param tx - Cliente de transação Prisma
   * @param tenantId - ID do tenant
   * @returns Número da fatura
   */
  private async generateInvoiceNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<string> {
    const pad = (n: number, s: number) => String(n).padStart(s, '0');

    const now = new Date();
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1, 2);

    const last = await tx.invoice.findFirst({
      where: {
        tenantId,
        number: { startsWith: `${year}-${month}` },
      },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    let seq = 1;

    if (last?.number) {
      const parts = last.number.split('-');
      const lastSeq = Number(parts[2]);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    const number = `${year}-${month}-${pad(seq, 6)}`;

    const exists = await tx.invoice.findUnique({
      where: { number },
    });

    if (exists) {
      // Recursão para garantir unicidade (raro, mas seguro)
      return this.generateInvoiceNumber(tx, tenantId);
    }

    return number;
  }

  async remove(
    id: number,
    tenantId: string,
  ) {
    const estimate = await this.findOne(
      id,
      tenantId,
    );

    if (estimate.pdfKey) {
      await this.storageService
        .deleteFile(estimate.pdfKey)
        .catch(() => null);
    }

    await this.prisma.estimate.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  private async generatePdfNow(
    estimate: any,
  ) {
    const estimateId = estimate.id;

    if (
      this.pdfGeneratingLocks.has(
        estimateId,
      )
    ) {
      let attempts = 0;

      while (
        this.pdfGeneratingLocks.has(
          estimateId,
        ) &&
        attempts < 30
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500),
        );

        attempts++;
      }

      const updatedEstimate =
        await this.prisma.estimate.findUnique({
          where: {
            id: estimateId,
          },
        });

      if (updatedEstimate?.pdfUrl) {
        return {
          pdfUrl:
            updatedEstimate.pdfUrl,

          pdfKey:
            updatedEstimate.pdfKey,
        };
      }
    }

    this.pdfGeneratingLocks.add(
      estimateId,
    );

    try {
      await this.prisma.estimate.update({
        where: {
          id: estimateId,
        },

        data: {
          pdfStatus: 'generating',
        },
      });

      const tenant =
        await this.prisma.tenant.findUnique({
          where: {
            id: estimate.tenantId,
          },
        });

      const fullEstimate =
        await this.prisma.estimate.findUnique({
          where: {
            id: estimate.id,
          },

          include: {
            client: true,
            items: true,
          },
        });

      const payload = {
        ...fullEstimate,
        tenant,
      };

      const pdfBuffer =
        await this.estimatesPdfService.generateEstimatePdf(
          payload,
        );

      const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;

      const pdfUrl =
        await this.storageService.uploadPdf(
          pdfBuffer,
          pdfKey,
        );

      await this.prisma.estimate.update({
        where: {
          id: estimate.id,
        },

        data: {
          pdfUrl,
          pdfKey,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });

      return {
        pdfUrl,
        pdfKey,
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao gerar PDF`,
        error?.stack || error,
      );

      await this.prisma.estimate
        .update({
          where: {
            id: estimate.id,
          },

          data: {
            pdfStatus: 'failed',
          },
        })
        .catch(() => null);

      throw new BadRequestException(
        'Erro ao gerar PDF',
      );
    } finally {
      this.pdfGeneratingLocks.delete(
        estimateId,
      );
    }
  }

  private async ensurePdf(
    estimateId: number,
    forceRegenerate = false,
  ) {
    const estimate =
      await this.prisma.estimate.findUnique({
        where: {
          id: estimateId,
        },

        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

    if (!estimate) {
      throw new NotFoundException(
        'Orçamento não encontrado',
      );
    }

    if (forceRegenerate) {
      return this.generatePdfNow(
        estimate,
      );
    }

    if (!estimate.pdfUrl) {
      return this.generatePdfNow(
        estimate,
      );
    }

    return {
      pdfUrl: estimate.pdfUrl,
      pdfKey: estimate.pdfKey,
    };
  }

  async resendPdf(
    id: number,
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);

    await this.ensurePdf(id, true);

    const estimate =
      await this.prisma.estimate.findUnique({
        where: {
          id,
        },
      });

    return {
      success: true,
      pdfUrl: estimate?.pdfUrl,
    };
  }

  async generateShareLink(
    estimateId: number,
    tenantId: string,
  ) {
    const estimate = await this.findOne(
      estimateId,
      tenantId,
    );

    await this.ensurePdf(estimateId);

    const existingShare =
      await this.prisma.publicShare.findFirst({
        where: {
          resourceId: estimateId,
          type: 'ESTIMATE',
          tenantId,

          expiresAt: {
            gt: new Date(),
          },
        },
      });

    let token: string;

    if (existingShare) {
      token = existingShare.token;
    } else {
      token = randomBytes(32).toString(
        'hex',
      );

      await this.prisma.publicShare.create({
        data: {
          token,
          type: 'ESTIMATE',
          resourceId: estimateId,
          tenantId:
            estimate.tenantId,

          expiresAt: new Date(
            Date.now() +
              7 * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }

    const baseUrl =
      process.env.API_URL ||
      'http://localhost:3000/api';

    return {
      shareUrl: `${baseUrl}/public/estimates/share/${token}`,
    };
  }

  async sendToWhatsApp(
    id: number,
    tenantId: string,
    phoneNumber: string,
  ) {
    const estimate = await this.findOne(
      id,
      tenantId,
    );

    await this.ensurePdf(id);

    const { shareUrl } =
      await this.generateShareLink(
        id,
        tenantId,
      );

    const cleanPhone =
      phoneNumber.replace(/\D/g, '');

    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 13
    ) {
      throw new BadRequestException(
        'Número inválido',
      );
    }

    const finalPhone =
      cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`;

    const message =
      `📄 *ORÇAMENTO #${estimate.id}*\n` +
      `👤 Cliente: ${estimate.client?.name || '-'}\n` +
      `💰 Total: R$ ${Number(
        estimate.total,
      ).toFixed(2)}\n` +
      `🔗 ${shareUrl}`;

    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(
      message,
    )}`;

    return {
      success: true,
      whatsappUrl,
      phoneNumber: finalPhone,
    };
  }
}/ /   F O R C E   R E B U I L D   -   2 0 2 6 - 0 5 - 1 7   2 2 : 3 9 : 4 5  
 
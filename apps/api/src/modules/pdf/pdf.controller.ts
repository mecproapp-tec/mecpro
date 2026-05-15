import { Controller, Get, Param, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';

@Controller('pdf')
@UseGuards(JwtAuthGuard)  // ✅ Protege o endpoint por padrão
export class PdfController {
  
  @Get(':filename')
  async getPdf(@Param('filename') filename: string, @Res() res: Response) {
    // 🔥 CORREÇÃO #1: Sanitizar o filename para prevenir path traversal
    const sanitizedFilename = path.basename(filename);
    
    // 🔥 CORREÇÃO #2: Verificar se o filename contém apenas caracteres seguros
    const isValidFilename = /^[a-zA-Z0-9._-]+$/.test(sanitizedFilename);
    if (!isValidFilename) {
      throw new NotFoundException('Nome de arquivo inválido');
    }
    
    // 🔥 CORREÇÃO #3: Restringir a extensão para .pdf
    if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
      throw new NotFoundException('Tipo de arquivo não permitido');
    }
    
    // Caminho correto para os PDFs
    const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', sanitizedFilename);
    
    // 🔥 CORREÇÃO #4: Verificar se o caminho está dentro do diretório permitido
    const allowedDir = path.join(process.cwd(), 'uploads', 'pdfs');
    const resolvedPath = path.resolve(pdfPath);
    if (!resolvedPath.startsWith(allowedDir)) {
      console.error(`❌ Tentativa de path traversal: ${filename}`);
      throw new NotFoundException('Acesso negado');
    }
    
    console.log(`📄 Procurando PDF: ${pdfPath}`);
    
    if (fs.existsSync(pdfPath)) {
      console.log(`✅ PDF encontrado: ${sanitizedFilename}`);
      const stat = fs.statSync(pdfPath);
      console.log(`📦 Tamanho: ${stat.size} bytes`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');  // 🔥 Segurança adicional
      
      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      return;
    }
    
    console.log(`❌ PDF não encontrado: ${pdfPath}`);
    throw new NotFoundException(`Arquivo ${sanitizedFilename} não encontrado`);
  }
}
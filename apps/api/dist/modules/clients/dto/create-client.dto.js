"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClientDto = void 0;
const class_validator_1 = require("class-validator");
class CreateClientDto {
}
exports.CreateClientDto = CreateClientDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Nome deve ser texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome é obrigatório' }),
    __metadata("design:type", String)
], CreateClientDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Telefone deve ser texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Telefone é obrigatório' }),
    (0, class_validator_1.Matches)(/^[0-9]{10,11}$/, { message: 'Telefone deve ter 10 ou 11 dígitos' }),
    __metadata("design:type", String)
], CreateClientDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Veículo deve ser texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "vehicle", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Placa deve ser texto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Za-z]{3}[0-9]{4}$|^[A-Za-z]{3}[0-9]{1}[A-Za-z]{1}[0-9]{2}$/, {
        message: 'Placa deve estar no formato antigo (ABC1234) ou Mercosul (ABC1D23)',
    }),
    __metadata("design:type", String)
], CreateClientDto.prototype, "plate", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Documento deve ser texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "document", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Endereço deve ser texto' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "address", void 0);
//# sourceMappingURL=create-client.dto.js.map
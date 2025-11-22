import { describe, it, expect } from 'vitest';
import { ShippingAgentValidationError, ShippingAgentNotFoundError } from '../../../domain/shippingAgent/shippingAgent.errors';

// Testes asseguram comportamento básico das classes de erro de domínio.
// Útil para detectar regressões na hierarquia ou nomes caso refactors ocorram.

describe('ShippingAgent Domain Errors', () => {
  describe('ShippingAgentValidationError', () => {
    it('cria erro com mensagem correta', () => {
      const err = new ShippingAgentValidationError('Invalid data');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ShippingAgentValidationError);
      expect(err.name).toBe('ShippingAgentValidationError');
      expect(err.message).toBe('Invalid data');
      expect(typeof err.stack).toBe('string');
    });

    it('é lançável e apanhado pelo tipo específico', () => {
      expect(() => { throw new ShippingAgentValidationError('Bad'); }).toThrow(ShippingAgentValidationError);
      expect(() => { throw new ShippingAgentValidationError('Bad'); }).toThrow('Bad');
    });

    it('suporta múltiplas mensagens de validação', () => {
      const messages = [
        'Organization name is required',
        'Organization tax number is invalid',
        'Initial representative email appears invalid.',
        'Phone must contain at least 8 digits.',
        'Citizen ID format is invalid.'
      ];
      for (const m of messages) {
        const err = new ShippingAgentValidationError(m);
        expect(err.message).toBe(m);
        expect(err.name).toBe('ShippingAgentValidationError');
      }
    });
  });

  describe('ShippingAgentNotFoundError', () => {
    it('cria erro not found', () => {
      const err = new ShippingAgentNotFoundError('Representative not found');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ShippingAgentNotFoundError);
      expect(err.name).toBe('ShippingAgentNotFoundError');
      expect(err.message).toBe('Representative not found');
      expect(typeof err.stack).toBe('string');
    });

    it('é lançável e apanhado pelo tipo específico', () => {
      expect(() => { throw new ShippingAgentNotFoundError('Missing'); }).toThrow(ShippingAgentNotFoundError);
      expect(() => { throw new ShippingAgentNotFoundError('Missing'); }).toThrow('Missing');
    });
  });

  describe('Hierarquia & Inheritance', () => {
    it('mantém cadeia de herança correta', () => {
      const vErr = new ShippingAgentValidationError('X');
      const nfErr = new ShippingAgentNotFoundError('Y');
      // Checks essenciais (evitando warnings redundantes de instanceof em TS static analysis)
      expect(vErr.name).toBe('ShippingAgentValidationError');
      expect(nfErr.name).toBe('ShippingAgentNotFoundError');
      expect(vErr.message).toBe('X');
      expect(nfErr.message).toBe('Y');
    });
  });
});

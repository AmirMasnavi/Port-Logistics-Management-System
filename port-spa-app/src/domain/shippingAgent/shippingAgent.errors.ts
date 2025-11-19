// Custom domain-level errors for validation and not found cases
export class ShippingAgentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShippingAgentValidationError';
  }
}

export class ShippingAgentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShippingAgentNotFoundError';
  }
}


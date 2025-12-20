// javascript
/**
 * DTO for creating a new Incident Type
 *
 * Fields:
 *  - code: unique identifier string (e.g. T-INC001)
 *  - name: display name
 *  - description: optional detailed explanation
 *  - severity: one of 'Minor', 'Major', 'Critical'
 *  - parentId: optional GUID of parent incident type to build hierarchy
 *
 * validate() returns an object { isValid, errors } similar to Vve DTOs.
 */
export class CreateIncidentTypeDto {
    constructor({ code, name, description = '', severity = 'Minor', parentId = null }) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.severity = severity;
        this.parentId = parentId;
    }

    _isValidId(value) {
        if (!value) return false;
        return typeof value === 'string' && value.length > 0;
    }
   
    validate() {
        const errors = [];
        const allowed = ['Minor', 'Major', 'Critical'];

        if (!this.code || this.code.trim() === '') {
            errors.push('Code é obrigatório');
        } else if (this.code.length > 32) {
            errors.push('Code não pode ter mais de 32 caracteres');
        }

        if (!this.name || this.name.trim() === '') {
            errors.push('Name é obrigatório');
        } else if (this.name.length > 128) {
            errors.push('Name não pode ter mais de 128 caracteres');
        }

        if (!allowed.includes(this.severity)) {
            errors.push(`Severity inválida. Deve ser uma de: ${allowed.join(', ')}`);
        }

        if (this.parentId && !this._isValidId(this.parentId)) {
            errors.push('ParentId deve ser um identificador válido');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * DTO for updating an existing Incident Type
 *
 * Same shape as CreateIncidentTypeDto but used for updates.
 * validate() applies the same rules as create DTO.
 */
export class UpdateIncidentTypeDto {
    constructor({ code, name, description = '', severity = 'Minor', parentId = null }) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.severity = severity;
        this.parentId = parentId;
    }

    _isValidId(value) {
        if (!value) return false;
        return typeof value === 'string' && value.length > 0;
    }
    /**
     * Validate update payload.
     * Note: uniqueness of `code` must be enforced server-side (DB/service).
     */
    validate() {
        const errors = [];
        const allowed = ['Minor', 'Major', 'Critical'];

        if (!this.code || this.code.trim() === '') {
            errors.push('Code é obrigatório');
        } else if (this.code.length > 32) {
            errors.push('Code não pode ter mais de 32 caracteres');
        }

        if (!this.name || this.name.trim() === '') {
            errors.push('Name é obrigatório');
        } else if (this.name.length > 128) {
            errors.push('Name não pode ter mais de 128 caracteres');
        }

        if (!allowed.includes(this.severity)) {
            errors.push(`Severity inválida. Deve ser uma de: ${allowed.join(', ')}`);
        }

        if (this.parentId && !this._isValidId(this.parentId)) {
            errors.push('ParentId deve ser um identificador válido');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * DTO used to shape Incident Type responses sent to the client.
 *
 * Fields:
 *  - id: GUID
 *  - code, name, description, severity
 *  - parentId: GUID or null
 *  - parentCode / parentName: optional helper fields to avoid extra client joins
 *  - createdAt / updatedAt: timestamps
 */
export class IncidentTypeResponseDto {
    constructor({
                    id,
                    code,
                    name,
                    description = null,
                    severity,
                    parentId = null,
                    parentCode = null,
                    parentName = null,
                    createdAt = null,
                    updatedAt = null,
                }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.severity = severity;
        this.parentId = parentId;
        this.parentCode = parentCode;
        this.parentName = parentName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

/**
 * Lightweight DTO for listing items in tables.
 *
 * Contains the minimum fields needed for list views.
 */
export class IncidentTypeListItemDto {
    constructor({ id, code, name, severity, parentId = null, parentName = null, createdAt = null }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.severity = severity;
        this.parentId = parentId;
        this.parentName = parentName;
        this.createdAt = createdAt;
    }
}
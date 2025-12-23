/**
 * DTO for creating a new Incident Type
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
            errors.push('Code is required');
        } 

        if (!this.name || this.name.trim() === '') {
            errors.push('Name is required');
        } 

        if (!allowed.includes(this.severity)) {
            errors.push(`Invalid severity. Must be one of: ${allowed.join(', ')}`);
        }

        if (this.parentId && !this._isValidId(this.parentId)) {
            errors.push('ParentId must be a valid identifier');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * DTO for updating an existing Incident Type
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

    validate() {
        const errors = [];
        const allowed = ['Minor', 'Major', 'Critical'];

        if (!this.code || this.code.trim() === '') {
            errors.push('Code is required');
        }
        if (!this.name || this.name.trim() === '') {
            errors.push('Name is required');
        }
        if (!allowed.includes(this.severity)) {
            errors.push(`Invalid severity. Must be one of: ${allowed.join(', ')}`);
        }
        if (this.parentId && !this._isValidId(this.parentId)) {
            errors.push('ParentId must be a valid identifier');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * DTO used for responses
 */
export class IncidentTypeResponseDto {
    constructor({
                    id,
                    code,
                    name,
                    description,
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
 * Lightweight DTO for list views
 */
export class IncidentTypeListItemDto {
    constructor({ id, code, name, description, severity, parentId = null, createdAt = null }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.severity = severity;
        this.parentId = parentId;
        this.createdAt = createdAt;
        this.description = description;
    }
}
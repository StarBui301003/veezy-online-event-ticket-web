// src/lib/formValidation.ts
// Inline validation logic and error messages for forms


export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string | ((t?: (key: string) => string) => string);
}

export type FieldValidationConfig = {
  [field: string]: ValidationRule[];
};

export const collaboratorValidationConfig: FieldValidationConfig = {
  username: [
    {
      validate: (v) => v.trim().length > 0,
      message: (t) => t ? t('event_manager.create_collaborator.errorUsernameRequired') : 'event_manager.create_collaborator.errorUsernameRequired'
    }
  ],
  email: [
    {
      validate: (v) => v.trim().length > 0,
      message: (t) => t ? t('event_manager.create_collaborator.errorEmailRequired') : 'event_manager.create_collaborator.errorEmailRequired'
    },
    {
      validate: (v) => /^\S+@\S+\.\S+$/.test(v),
      message: (t) => t ? t('event_manager.create_collaborator.errorEmailInvalid') : 'event_manager.create_collaborator.errorEmailInvalid'
    }
  ],
  phone: [
    {
      validate: (v) => v.trim().length > 0,
      message: (t) => t ? t('event_manager.create_collaborator.errorPhoneRequired') : 'event_manager.create_collaborator.errorPhoneRequired'
    },
    {
      validate: (v) => /^\d{8,15}$/.test(v.replace(/\D/g, '')),
      message: (t) => t ? t('event_manager.create_collaborator.errorPhoneInvalid') : 'event_manager.create_collaborator.errorPhoneInvalid'
    }
  ],
  password: [
    {
      validate: (v) => v.length > 0,
      message: (t) => t ? t('event_manager.create_collaborator.errorPasswordRequired') : 'event_manager.create_collaborator.errorPasswordRequired'
    },
    {
      validate: (v) => v.length >= 6,
      message: (t) => t ? t('event_manager.create_collaborator.errorPasswordLength') : 'event_manager.create_collaborator.errorPasswordLength'
    }
  ],
  fullName: [
    {
      validate: (v) => v.trim().length > 0,
      message: (t) => t ? t('event_manager.create_collaborator.errorFullNameRequired') : 'event_manager.create_collaborator.errorFullNameRequired'
    }
  ],
  dateOfBirth: [
    {
      validate: (v) => !!v,
      message: (t) => t ? t('event_manager.create_collaborator.errorDateOfBirthRequired') : 'event_manager.create_collaborator.errorDateOfBirthRequired'
    }
  ]
};

// Trả về tất cả lỗi cho từng field (mảng), hỗ trợ truyền t vào để lấy message đa ngôn ngữ
export function validateFields(
  data: Record<string, string>,
  config: FieldValidationConfig,
  t?: (key: string) => string
): Partial<Record<string, string[]>> {
  const errors: Partial<Record<string, string[]>> = {};
  for (const field in config) {
    const rules = config[field];
    const fieldErrors: string[] = [];
    for (const rule of rules) {
      if (!rule.validate(data[field] || '')) {
        if (typeof rule.message === 'function') {
          fieldErrors.push(rule.message(t));
        } else {
          fieldErrors.push(rule.message);
        }
      }
    }
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }
  return errors;
}

import { z, ZodError } from 'zod';

export function formatZodError(error: ZodError) {
  if (!error || typeof error.format !== 'function') {
    throw new Error(
      'The argument to formatZodError must be a zod error with error.format()'
    );
  }

  const errors = error.format();
  return recursiveFormatZodErrors(errors);
}

export function recursiveFormatZodErrors<S extends z.ZodType<any, any>>(
  errors: any
) {
  let formattedErrors: Record<string, any> = {};

  for (const key in errors) {
    if (key === '_errors') {
      continue;
    }

    if (errors[key]?._errors?.[0]) {
      if (!isNaN(key as any) && !Array.isArray(formattedErrors)) {
        formattedErrors = [];
      }
      formattedErrors[key] = errors[key]._errors[0];
    } else {
      if (!isNaN(key as any) && !Array.isArray(formattedErrors)) {
        formattedErrors = [];
      }
      formattedErrors[key] = recursiveFormatZodErrors(errors[key]);
    }
  }

  return { errors: formattedErrors };
}

const validateZodSchemaAsync =
  <S extends z.ZodType<any, any>>(schema: S) =>
  async (values: z.TypeOf<S>) => {
    if (!schema) return { values };
    try {
      const val: z.TypeOf<S> = await schema.parseAsync(values);
      return { values: val };
    } catch (error: any) {
      return error.format
        ? formatZodError(error)
        : { errors: error.toString() };
    }
  };

export type ValidateReturnType<S extends z.ZodType<any, any>> =
  | {
      values: z.TypeOf<S>;
      errors?: undefined;
    }
  | {
      errors: any;
      values?: undefined;
    };

export function validateZodSchema<S extends z.ZodType<any, any>>(
  schema: S,
  values: z.TypeOf<S>
): Promise<ValidateReturnType<S>> {
  return validateZodSchemaAsync(schema)(values);
}

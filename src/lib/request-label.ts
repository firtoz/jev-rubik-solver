// Presentation only: distinguish questions that share the same response field.
export function preparationLabel(request: { questions: Record<string, { criteria?: Record<string, unknown> } | undefined> }): string | undefined {
  const criteria = request.questions.preparation?.criteria;
  if (!criteria) return undefined;
  if ('extract-corner' in criteria) return 'Check corner extraction';
  if ('extract-edge' in criteria) return 'Check edge extraction';
  if ('align-corner' in criteria) return 'Check corner alignment';
  if ('align-edge' in criteria) return 'Check edge alignment';
  return undefined;
}

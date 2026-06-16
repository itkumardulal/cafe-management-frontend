export type RecipeLinePayload = {
  rawMaterialItemId: string;
  quantity: number;
  unit?: string;
  notes?: string;
};

export type UpsertRecipePayload = {
  yieldQuantity?: number;
  yieldUnit?: string;
  prepNotes?: string;
  lines: RecipeLinePayload[];
};

export type RecipeLineDetail = {
  rawMaterialItemId: string;
  name: string;
  unit: string | null;
  quantity: string;
  notes: string | null;
  sortOrder: number;
};

export type RecipeDetail = {
  menuItemId: string;
  name: string;
  categoryName: string;
  menuCategoryId: string;
  imageUrl: string | null;
  yieldQuantity: string;
  yieldUnit: string | null;
  prepNotes: string | null;
  lines: RecipeLineDetail[];
};

export type RecipeListItem = {
  id: string;
  menuItemId: string;
  name: string;
  categoryName: string;
  menuCategoryId: string;
  yieldQuantity: string;
  yieldUnit: string | null;
  lineCount: number;
  updatedAt: string;
};

export type PreparedDishOption = {
  id: string;
  name: string;
  categoryName: string;
};

export type RawMaterialOption = {
  id: string;
  name: string;
  unit: string | null;
};

export type RecipeLineFormRow = {
  rawMaterialItemId: string;
  quantity: string;
  unit: string;
  notes: string;
};

export const emptyRecipeLine = (): RecipeLineFormRow => ({
  rawMaterialItemId: "",
  quantity: "",
  unit: "",
  notes: "",
});

export type RecipeFormState = {
  yieldQuantity: string;
  yieldUnit: string;
  prepNotes: string;
  lines: RecipeLineFormRow[];
};

export const emptyRecipeForm = (): RecipeFormState => ({
  yieldQuantity: "1",
  yieldUnit: "",
  prepNotes: "",
  lines: [emptyRecipeLine()],
});

export function recipeDetailToForm(detail: RecipeDetail): RecipeFormState {
  return {
    yieldQuantity: detail.yieldQuantity,
    yieldUnit: detail.yieldUnit ?? "",
    prepNotes: detail.prepNotes ?? "",
    lines:
      detail.lines.length > 0
        ? detail.lines.map((line) => ({
            rawMaterialItemId: line.rawMaterialItemId,
            quantity: line.quantity,
            unit: line.unit ?? "",
            notes: line.notes ?? "",
          }))
        : [emptyRecipeLine()],
  };
}

export function buildRecipePayload(
  yieldQuantity: string,
  yieldUnit: string,
  prepNotes: string,
  lines: RecipeLineFormRow[],
): UpsertRecipePayload | null {
  const completeLines = lines
    .filter((line) => line.rawMaterialItemId && line.quantity.trim() !== "")
    .map((line) => ({
      rawMaterialItemId: line.rawMaterialItemId,
      quantity: Number(line.quantity),
      unit: line.unit.trim() || undefined,
      notes: line.notes.trim() || undefined,
    }))
    .filter((line) => !Number.isNaN(line.quantity) && line.quantity > 0);

  if (completeLines.length === 0) {
    return null;
  }

  const ids = new Set<string>();
  for (const line of completeLines) {
    if (ids.has(line.rawMaterialItemId)) {
      return null;
    }
    ids.add(line.rawMaterialItemId);
  }

  const yieldQty = yieldQuantity.trim() === "" ? 1 : Number(yieldQuantity);
  if (Number.isNaN(yieldQty) || yieldQty <= 0) {
    return null;
  }

  return {
    yieldQuantity: yieldQty,
    yieldUnit: yieldUnit.trim() || undefined,
    prepNotes: prepNotes.trim() || undefined,
    lines: completeLines,
  };
}

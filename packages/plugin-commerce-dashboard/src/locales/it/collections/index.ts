import common from "./common.json";
import fields from "./fields.json";
import sections from "./sections.json";
import buttons from "./buttons.json";
import table from "./table.json";
import filters from "./filters.json";
import status from "./status.json";
import meta from "./meta.json";
import seo from "./seo.json";
import details from "./details.json";
import create from "./create.json";
import deleteModal from "./delete.json";
import placeholders from "./placeholders.json";
import errors from "./errors.json";
import unsavedChanges from "./unsaved-changes.json";

export default {
  ...common,
  fields,
  sections,
  buttons,
  table,
  filters,
  status,
  meta,
  seo,
  details,
  create,
  delete: deleteModal,
  placeholders,
  errors,
  unsavedChanges,
};

import common from "./common.json";
import actions from "./actions.json";
import buttons from "./buttons.json";
import search from "./search.json";
import filters from "./filters.json";
import emptyState from "./empty-state.json";
import table from "./table.json";
import fields from "./fields.json";
import status from "./status.json";
import details from "./details.json";
import create from "./create.json";
import deleteModal from "./delete.json";

export const products = {
  ...common,
  actions,
  buttons,
  search,
  filters,
  emptyState,
  table,
  fields,
  status,
  details,
  create,
  delete: deleteModal,
};

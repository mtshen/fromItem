import type { FormItemExPropsType, FromDataType } from "./type";

/**
 * 得到实际可用的属性
 * @param item
 * @param allItemValue
 * @returns
 */
export function getAppendBind(
  propItem: FormItemExPropsType,
  allItemValue: FromDataType,
  allData: FromDataType,
): FormItemExPropsType {
  const { appendAttrsFn, data, ...option } = propItem;
  const newData = typeof data === "function" ? data() : data || [];

  if (appendAttrsFn) {
    const opt = { ...option, data: newData, ...appendAttrsFn(allItemValue, allData) };
    return opt;
  }

  return {
    ...option,
    data: newData,
  };
}

/**
 *
 * @returns
 */
export function getFromConditionItems(props: FormItemExPropsType[], allData: FromDataType) {
  return props.filter(item => {
    const propVal = item.prop ? allData[item.prop] : "";
    const itemAttr = getAppendBind(item, propVal, allData);
    return "condition" in itemAttr ? itemAttr.condition : true;
  });
}

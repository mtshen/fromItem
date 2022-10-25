export interface FormItemExPropsType {
  prop?: string;
  span?: number;
  label?: string;
  onlyComponent?: boolean; // 是否忽略label展示, 为了解决checked的显示效果
  condition?: boolean;
  describe?: string; // 描述
  component?: string;
  appendAttrsFn?(value: any, fromData: any): { [k: string]: any }; // 动态attr
  set?(value: any, fromData: { [k: string]: any }): void; // 自定义的设置
  get?(fromData: { [k: string]: any }): void; // 自定义的回显
  divider?: boolean; // 是否是分割线
  appendSlotName?: string; // 追加的自定义内容
  isTitle?: boolean;
  placeholder?: string;
  suffixName?: string;
  event?: { [k: string]: Function };
  [key: string]: any;
}

export interface FromDataType {
  [key: string]: any;
}

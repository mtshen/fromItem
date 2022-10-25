<template>
  <el-form-item
    :prop="componentProp"
    :rules="curBindAttrs.rules"
    :label="$t(componentLabel)"
    :label-width="componentLabelWidth"
    class="w100"
  >
    <template #label="{ label }">
      <el-tooltip
        v-if="curBindAttrs.describe"
        effect="dark"
        :enterable="false"
        :content="$t(curBindAttrs.describe)"
        placement="bottom"
      >
        <span class="mapFont map-font-info describeIcon"></span>
      </el-tooltip>
      <span
        class="labelCont"
        :class="{ title: curBindAttrs.isTitle, desc: curBindAttrs.describe }"
        >{{ $t(label) }}</span
      >
    </template>
    <template v-if="curItemComponentName">
      <!-- trim -->
      <elInput
        v-if="componentNameisInput"
        v-model.trim="value"
        class="queryFormItemStyle"
        autocomplete="off"
        v-bind="bindPropOption"
        :size="item.size || size"
        :placeholder="$t(curBindAttrs.placeholder || defPlaceholder)"
        v-on="curBindAttrs.event || {}"
        @change="updateValue"
        @keyup.native="(val:KeyboardEvent) => _handleKeyUp(val, item)"
      >
        <template v-if="item.suffixName" #suffix>
          {{ item.suffixName }}
        </template>
      </elInput>
      <component
        v-else
        :is="curItemComponentName"
        v-model="value"
        class="queryFormItemStyle"
        autocomplete="off"
        v-bind="bindPropOption"
        :size="item.size || size"
        :placeholder="$t(curBindAttrs.placeholder || defPlaceholder)"
        v-on="curBindAttrs.event || {}"
        @change="updateValue"
      >
        <!-- 针对select组件 -->
        <template v-if="componentNameisSelect" #default>
          <el-option
            v-for="(children, num) in curBindAttrs.data"
            :key="num"
            v-bind="children"
            :label="$t(children.label)"
            :value="children.value"
          />
        </template>

        <!-- 针对checkboxgroup组件 -->
        <template v-else-if="componentNameisCheckboxGroup" #default>
          <el-checkbox
            v-for="(children, num) in curBindAttrs.data"
            :key="num"
            v-bind="children"
            :label="$t(children.label)"
          >
            {{ children.label }}
          </el-checkbox>
        </template>

        <!-- 针对radiogroup组件 -->
        <template v-else-if="componentNameisRadioGroup" #default>
          <el-radio
            v-for="(children, num) in curBindAttrs.data"
            :key="num"
            v-bind="children"
            :label="$t(children.label)"
          >
            {{ children.label }}
          </el-radio>
        </template>
      </component>
    </template>

    <template v-else-if="!curBindAttrs.appendSlotName">
      {{ curItemValue }}
    </template>

    <slot
      v-if="curBindAttrs.appendSlotName"
      :name="curBindAttrs.appendSlotName"
      :fromData="allItemValue"
      :value="curItemValue"
      :update="slotUpdateValue"
    />
  </el-form-item>
</template>

<script setup lang="ts">
/**
 * ⭐ 使用mChange要小心, 因为此函数的第二个参数不包含本次变更
 * ⭕ 在单独使用fromItem时, get/set函数不能生效, 因为这两个函数依托于fromData
 */
import type { ComputedRef, Ref } from "vue";
import { withDefaults, ref, computed, watch } from "vue";
import { getAppendBind } from "./common";
interface FormItemExPropsType {
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

interface FormItemProps {
  item: FormItemExPropsType;
  size?: string;
  curItemValue: any;
  allItemValue: any;
}

interface UpdateEmitsType {
  attr: FormItemExPropsType;
  value: any;
}

/* 组件使用的props */
const props = withDefaults(defineProps<FormItemProps>(), {
  size: "small",
  curItemValue: "",
});

/* 组件可以抛出的事件 */

const emits = defineEmits<{
  (event: "update", data: UpdateEmitsType): void;
}>();

/* 组件使用和抛出的值 */
const value: Ref<any> = ref("");

watch(
  () => props.curItemValue,
  () => (value.value = props.curItemValue),
  {
    immediate: true,
    deep: true,
  }
);

// 数据的变更
function updateValue() {
  const attr = curBindAttrs.value;
  const mChange = attr.mChange;
  mChange && mChange(value.value, props.allItemValue);
  emits("update", { attr, value: value.value });
}

/**
 * slot数据变更, 与updateValue基本相同, 单独领出来
 * @param updateValue 变更的值
 */
function slotUpdateValue(updateValue: any) {
  const attr = curBindAttrs.value;
  const mChange = attr.mChange;
  mChange && mChange(value.value, props.allItemValue);
  emits("update", { attr, value: updateValue });
}

/* 当前组件绑定的属性 */
const curBindAttrs: ComputedRef<FormItemExPropsType> = computed(() =>
  getAppendBind(props.item, props.curItemValue, props.allItemValue)
);

// 组件属性
// prop
const componentProp = computed(() => props.item.prop);

// label
const componentLabel: ComputedRef<string> = computed(() => {
  const { label = "", onlyComponent } = props.item;
  return onlyComponent ? "" : label;
});

// label-width
const componentLabelWidth = computed(() => {
  const { onlyComponent, labelWidth } = props.item;
  return onlyComponent ? "0px" : labelWidth;
});

/* 当前组件使用的 Component */
const curItemComponentName: ComputedRef<string> = computed(() =>
  __getComponent(props.item.component)
);
/* 当前组件是否是 Input */
const componentNameisInput: ComputedRef<boolean> = computed(
  () => curItemComponentName.value === "elInput"
);
/* 当前组件是否是 Select */
const componentNameisSelect: ComputedRef<boolean> = computed(
  () => curItemComponentName.value === "elSelect"
);
/* 当前组件是否是 单选组 */
const componentNameisRadioGroup: ComputedRef<boolean> = computed(
  () => curItemComponentName.value === "elRadioGroup"
);
/* 当前组件是否是 多选按钮组 */
const componentNameisCheckboxGroup: ComputedRef<boolean> = computed(
  () => curItemComponentName.value === "elCheckboxGroup"
);

/*当前组件的默认*/
const defPlaceholder: ComputedRef<string> = computed(() => {
  if (componentNameisSelect.value) {
    return "lang.rms.fed.pleaseChoose";
  } else if (componentNameisInput.value) {
    return "lang.rms.fed.pleaseEnter";
  }
  return "";
});

/* 当前组件绑定的自定义属性 */
const bindPropOption = computed(() => {
  const bindAttr: { [k: string]: any } = {};
  const gnroe = [
    "prop",
    "span",
    "get",
    "set",
    "condition",
    "describe",
    "component",
    "appendAttrsFn",
    "onlyComponent",
    "divider",
    "appendSlotName",
    "isTitle",
    "placeholder",
    "event",
  ];

  const curAttr = curBindAttrs.value;
  if (curAttr) {
    Object.keys(curAttr).forEach((key) => {
      if (!gnroe.includes(key)) {
        bindAttr[key] = curAttr[key];
      }
    });
  }
  return bindAttr;
});

/**
 * 获取传入的item种的component内容
 * @param component { string | Function }
 * @param row { Object }
 */
function __getComponent(component: string | Function | undefined): string {
  switch (typeof component) {
    case "string":
      return component;
    case "function":
      return component(props.item);
    default:
      return "";
  }
}

/* 组件的一些回调函数*/
function _handleKeyUp(keyEvent: KeyboardEvent, formItem: FormItemExPropsType) {
  const { keyup, type } = formItem;
  // textarea 需要处理分行功能，tirm会过滤分行
  if (keyEvent.keyCode === 13 && type === "textarea") {
    value.value = `${value.value}\n`;
  }
  keyup && keyup(keyEvent, formItem);
}

defineExpose({
  curItemComponentName,
  componentNameisSelect,
  componentNameisRadioGroup,
  componentNameisCheckboxGroup,
});
</script>
<style scoped lang="scss">
.w100 {
  width: 100%;
}
.queryFormItemStyle {
  width: 100%;
}

.title {
  font-weight: 900;
}

.describeIcon {
  position: absolute;
  left: 0px;
  color: #409eff;
}

.labelCont {
  display: inline-block;
  &.desc {
    text-indent: 20px;
  }
}
</style>

<style lang="scss">
.el-form-item--default {
  .el-form-item__label {
    position: relative;
  }
}
</style>

<template>
  <el-form
    ref="formRef"
    v-bind="attrs"
    status-icon
    :model="innerFormData"
    :size="size"
  >
    <el-row :gutter="20">
      <!-- 查询内容 -->
      <el-col
        v-for="item in innerFormItem"
        :key="item.prop"
        :span="item.span || 24"
      >
        <template v-if="item.hasOwnProperty('slotName') && item.slotName">
          <slot :name="item.slotName" v-bind="item" />
        </template>

        <FormItem
          v-else
          :item="item"
          :size="size"
          :cur-item-value="getValueByProp(item)"
          :all-item-value="innerFormData"
          @update="formItemUpdate"
        >
          <template v-for="slotName in appendSlots" #[slotName]="option">
            <slot :name="slotName" :option="option" />
          </template>
        </FormItem>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import type { ComputedRef, Ref } from "vue";
import {
  withDefaults,
  ref,
  computed,
  watch,
  useAttrs,
  useSlots,
  toRefs,
} from "vue";
import { getFromConditionItems } from "./common";
import FormItem from "./FormItem.vue";

const attrs = useAttrs();
const slots = useSlots();

// 入参
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

interface FormPropType {
  formItem: FormItemExPropsType[];
  formData: FromDataType | {};
  size?: string;
}

interface FromDataType {
  [key: string]: any;
}

const props = withDefaults(defineProps<FormPropType>(), {
  size: "default",
});

/* 组件可以抛出的事件 */
const emits = defineEmits<{
  (event: "update:form-data", data: any): void;
  (event: "reset"): void;
  (event: string, data: any): void;
}>();

const innerFormData: Ref<FromDataType> = ref({});

watch(
  () => props.formData,
  (value) => {
    innerFormData.value = parseInnerFormData(value as any);
  },
  {
    immediate: true,
    deep: true,
  }
);

const innerFormItem: ComputedRef<FormItemExPropsType[]> = computed(() => {
  return getFromConditionItems(props.formItem, innerFormData.value);
});

const appendSlots = computed(() => {
  return Object.keys(slots).filter((key) => key !== "default");
});

let updateCacheFormData = {};
const formItemUpdate = (data: { attr: FormItemExPropsType; value: any }) => {
  const { attr, value } = data;
  const newFormData = { ...innerFormData.value };

  if (attr.set) {
    attr.set(value, newFormData);
  } else if (attr.prop) {
    newFormData[attr.prop] = value;
  }

  innerFormData.value = newFormData;
  updateCacheFormData = newFormData;
  emits("update:form-data", newFormData);
};

const handelClickBtn = ({ type }: { type: string }) => {
  switch (type) {
    case "reset":
      resetFormData();
      break;
    default:
      emits(type, { ...innerFormData.value });
      break;
  }
};

const resetFormData = () => {
  emits("reset");
  innerFormData.value = {};
  emits("update:form-data", {});
};

const formRef = ref();
const getValidateFormModel = async () => {
  const is = await formRef.value.validate();
  return is ? Promise.resolve(innerFormData.value) : Promise.reject();
};

const getFormData = () => {
  return innerFormData.value;
};

const getUpdateCacheFormData = () => {
  return updateCacheFormData;
};

function parseInnerFormData(data: any) {
  return { ...data };
}

function update(value: any) {
  innerFormData.value = parseInnerFormData(value);
}

function getValueByProp(option: FormItemExPropsType) {
  const propName = option.prop;
  const dataGetFn = option.get;
  if (dataGetFn) {
    return dataGetFn(innerFormData.value);
  }

  if (propName) {
    return innerFormData.value[propName];
  }

  return "";
}

defineExpose({
  getUpdateCacheFormData,
  getValidateFormModel,
  formItemUpdate,
  handelClickBtn,
  resetFormData,
  innerFormData,
  getFormData,
  update,
  name: attrs.name,
});
</script>

<style>
.queryFormOperation .el-form-item__label {
  opacity: 0;
}
</style>

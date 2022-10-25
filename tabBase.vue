<template>
  <div class="title">{{ $t(title || "") }}</div>
  <el-tabs
    stretch
    v-model="tabActive"
    class="attr-tabs"
    :class="{ attrTabsOnly: tabs.length === 1 }"
    :type="tabType"
  >
    <el-tab-pane v-for="tabItem in tabs" class="attr-pane-sty" :name="tabItem.name">
      <template #label>
        <span class="attr-tabs-pane-title">
          <span>{{ $t(tabItem.tabTitle) }}</span>
        </span>
      </template>
      <el-scrollbar class="elScrollbar">
        <QueryForm
          ref="queryFormRefs"
          :form-data="innerFormData"
          @update:form-data="updateFromData"
          v-bind="tabItem"
        >
          <template v-for="slotName in appendSlots" #[slotName]="{ option }">
            <slot :name="slotName" :option="option" />
          </template>
        </QueryForm>
      </el-scrollbar>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
/**
 * 不在支持双向绑定, 但可以通过@change="(data) => fromData = data"的方式实现
 *
 */
import { getFromConditionItems } from "./common";
import QueryForm from "./fromBase.vue";
import { useSlots, watch, Ref, ref, toRefs } from "vue";

const slots = useSlots();
const appendSlots = Object.keys(slots);

/* 组件可以抛出的事件 */
const emits = defineEmits<{
  (event: "reset"): void;
  (event: "change", data: FromDataType): void;
}>();

interface FormItemExPropsType {
  prop?: string;
  span?: number;
  label?: string;
  onlyComponent?: boolean; // 是否忽略label展示, 为了解决checked的显示效果
  condition?: boolean;
  describe?: string; // 描述
  component?: string;
  appendAttrsFn?: Function; // 动态attr
  set?: Function; // 自定义的设置
  get?: Function; // 自定义的回显
  divider?: boolean; // 是否是分割线
  appendSlotName?: string; // 追加的自定义内容
  isTitle?: boolean;
  placeholder?: string;
  [key: string]: any;
}

interface FromDataType {
  [key: string]: any;
}

interface NodeAttrEditConf {
  name: string;
  tabTitle: string;
  formItem: FormItemExPropsType[];
  [key: string]: any;
}

interface NodeAttrEditItemConf {
  title?: string;
  tabType?: "card" | "border-card";
  tabs: NodeAttrEditConf[];
  fromData: FromDataType;
}

const props = defineProps<NodeAttrEditItemConf>();
const propRefs = toRefs(props);
const tabActive: Ref<string> = ref(props.tabs[0]?.name || "");
const innerFormData: Ref<FromDataType> = ref(setDefaulfOption(props.fromData, props.tabs));

const queryFormRefs = ref();

watch(
  propRefs.fromData,
  value => {
    innerFormData.value = setDefaulfOption(value, propRefs.tabs.value);
  },
  { immediate: true, deep: true },
);

watch(
  propRefs.tabs,
  value => {
    reTabActive();
  },
  { immediate: true, deep: true },
);

const resetFormData = () => {
  emits("reset");
  innerFormData.value = setDefaulfOption({}, propRefs.tabs.value);
};

/**
 * 补全
 * @param fromData 需要补全默认值的数据集合
 * @param tabs tabs-props集合
 */
function setDefaulfOption(fromData: FromDataType, tabs: NodeAttrEditConf[]): FromDataType {
  const data: FromDataType = {};

  tabs.forEach(item => {
    const comditionProps = getFromConditionItems(item.formItem, fromData);
    comditionProps.forEach(item => {
      item.prop && (data[item.prop] = item.defaultValue || "");
    });
  });

  return { ...data, ...fromData };
}

const clearValidate = () => {
  queryFormRefs.value.map((formElRef: any) => formElRef.clearValidate());
};

const getValidateFormModel = async () => {
  try {
    await Promise.all(
      queryFormRefs.value.map((formElRef: any) => formElRef.getValidateFormModel()),
    );
    return Promise.resolve(getFormData());
  } catch (error) {
    return Promise.reject();
  }
};

/**
 * 获取数据
 */
const getFormData = () => {
  return innerFormData.value;
};

/**
 * 更新数据
 */
const updateFromData = (data: FromDataType) => {
  innerFormData.value = {
    ...innerFormData.value,
    ...data,
  };

  emits("change", innerFormData.value);
};

function updated() {
  innerFormData.value = { ...innerFormData.value };
}

function setItem(key: string, value: any) {
  innerFormData.value[key] = value;
}

function setItemAll(data: FromDataType) {
  innerFormData.value = {
    ...innerFormData.value,
    ...data,
  };
}

/**
 * 如果检查到当前选中的tab无效则自动更新选中的tab
 */
function reTabActive() {
  const tabs = propRefs.tabs.value;
  if (tabs.length) {
    if (!tabs.find(item => item.name === tabActive.value)) {
      tabActive.value = tabs[0].name;
    }
  }
}

defineExpose({
  resetFormData,
  clearValidate,
  getFormData,
  getValidateFormModel,
  updated,
  reTabActive,
  setItem,
  setItemAll,
});
</script>

<style scoped lang="scss">
.attr-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.title {
  padding-left: 8px;
  font-weight: 900;
  font-size: 16px;
  padding-top: 5px;
  padding-bottom: 5px;
  border-left: 3px solid #409eff;
}
</style>

<style lang="scss">
.attr-tabs {
  &.el-tabs--top {
    .el-tabs__item {
      &.is-top:nth-child(2),
      &.is-top:last-child {
        padding-left: 20px;
        padding-right: 20px;
      }
    }
    .el-tabs__content {
      flex: 1;
      overflow-y: auto;
    }

    .attr-pane-sty {
      padding: 0px 10px;
      width: 300px;
      height: 100%;
      position: relative;
      overflow: auto;
    }
  }
  .el-form-item {
    &.is-error {
      .el-icon {
        &.el-input__icon {
          &.el-input__validateIcon {
            color: #f56c6c;
          }
        }
      }
    }

    .el-icon {
      &.el-input__icon {
        &.el-input__validateIcon {
          color: #67c23a;
        }
      }
    }
  }

  &.attrTabsOnly {
    .el-tabs__header {
      &.is-top {
        display: none;
      }
    }
  }
}

.elScrollbar {
  padding-right: 15px;

  .is-horizontal {
    display: none !important;
  }
}
</style>

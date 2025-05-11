import React from 'react';
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';
import './CustomSelect.less';

interface CustomSelectProps extends AntSelectProps {
  // 可以添加任何额外的自定义属性
}

const { Option: AntOption, OptGroup: AntOptGroup } = AntSelect;

// 扩展React.FC类型以支持静态属性
interface CustomSelectComponent extends React.FC<CustomSelectProps> {
  Option: typeof AntOption;
  OptGroup: typeof AntOptGroup;
}

const CustomSelect: CustomSelectComponent = (props) => {
  return (
    <AntSelect
      className="custom-select"
      popupClassName="custom-select-dropdown"
      {...props}
    />
  );
};

// 添加子组件
CustomSelect.Option = AntOption;
CustomSelect.OptGroup = AntOptGroup;

export default CustomSelect; 
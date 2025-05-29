import React from 'react';
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';
import './CustomSelect.less';

interface CustomSelectProps extends AntSelectProps {
  // Can add any additional custom attributes
}

const { Option: AntOption, OptGroup: AntOptGroup } = AntSelect;

// Extend React.FC type to support static properties
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

// Add sub-components
CustomSelect.Option = AntOption;
CustomSelect.OptGroup = AntOptGroup;

export default CustomSelect;
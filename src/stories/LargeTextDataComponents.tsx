import * as React from "react";
import { CellBase, DataEditorComponent, DataViewerComponent } from "..";

type Value = string | undefined;
type Cell = CellBase<Value> & {
  value: Value;
};

export const LargeTextMultiLineView: DataViewerComponent<Cell> = ({ cell }) => {
  let stringSet: string[] = [];
  if(cell?.value){
    stringSet = cell?.value.split('\n');
  };
  return <>{stringSet.map((value, index) => <span key={index}><span>{value}</span><br/></span>)}</>
};

export const LargeTextEllipsisView: DataViewerComponent<Cell> = ({ cell }) => {
  let stringSet: string[] = [];
  if(cell?.value){
    stringSet = cell?.value.split('\n');
  };
  return <span style={{
    display: 'inline-block', 
  lineHeight: '1.65',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  width: '150px',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}}>{cell?.value}</span>
};

export const LargeTextEdit: DataEditorComponent<Cell> = ({ cell, onChange }) => {
  const handleChange = React.useCallback(
    (e) => {
      onChange({ ...cell, value: e.target.value });
    },
    [cell, onChange]
  );
  return <textarea onChange={handleChange} value={cell?.value} style={{resize: 'none'}}></textarea>;
};
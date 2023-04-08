import React from "react";
import ReactMarkdown from 'react-markdown';
import gfm from "remark-gfm";
import { ErrorTab } from "src/components/ErrorTab/ErrorTab";
import { CodeBlock } from "src/components/CodeBlock/CodeBlock";

interface Props {
    content?: string;
}

const ResultPanel: React.FC<Props> = (props) =>{
  if (!props.content) {
    return (
      <ErrorTab error={""} />
    );
  }
  return (
    <div 
      className='p-2 m-2' 
      style={{
        width: "fit-content"
      }}>
      <ReactMarkdown 
        remarkPlugins={[gfm]}
        components={{
          table: (props) => (
            <div className='p-2 m-2'>
              <div 
                className='table-responsive card'
              >
                <table 
                  {...props} 
                  className="table table-striped table-bordered"
                  style={{ margin: "0px" }}  
                />
              </div>
            </div>
          ),
          thead: (props) => (
            <thead className="table-light">
              {props.children}
            </thead>
          ),
          pre: (props) => <CodeBlock {...props} />
        }}
      >
        {props.content}
      </ReactMarkdown>
    </div>
  );
};

export {
  ResultPanel
};
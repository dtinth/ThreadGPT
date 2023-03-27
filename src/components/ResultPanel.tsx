import React from "react";
import ReactMarkdown from 'react-markdown'
import gfm from "remark-gfm"
import { ErrorTab } from "./ErrorTab";

interface Props {
    content?: string;
}

const ResultPanel: React.FC<Props> = (props) =>{
    if (!props.content) {
        return (
            <ErrorTab error={""}></ErrorTab>
        )
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
              )
          }}
        >
            {props.content}
        </ReactMarkdown>
    </div>
    )
}

export {
    ResultPanel
}
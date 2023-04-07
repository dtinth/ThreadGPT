import { IndentSizesContext } from 'src/components/Indent';
import renderMeta from 'src/components/RenderMeta';
import { Message } from 'src/types/Message';

interface DetailTabProps{
    response?: any
    message?: Message
    timestamp?: string
}

function DetailTab(props: DetailTabProps) {
    return (
        <div className="pt-3">
          <div className="d-flex align-items-center">
            <IndentSizesContext.Consumer>
              {({ iconSize }) => (
                <div
                  className={`rounded-circle ${
                    props.message?.role === 'user'
                      ? 'bg-primary'
                      : props.message?.role === 'system'
                      ? 'bg-warning'
                      : 'bg-success'
                  } me-3`}
                  style={{ width: iconSize, height: iconSize }}
                />
              )}
            </IndentSizesContext.Consumer>
            <span>
              <strong>{props.message?.role}</strong>{' '}
              <small className="text-muted">
                <relative-time datetime={props.timestamp}></relative-time>
                {renderMeta(props.response)}
              </small>
            </span>
          </div>
        </div>
    )
}

export {
    DetailTab
}
import { ModelSelector } from 'src/components/Model/ModelSelector';
import { useModalParameter } from 'src/helper/ModalParameter';
import { convertToNumber } from 'src/helper/utils';
import { temperature, top_p } from 'src/keys/ModalParameters';

interface ModelButtonProps {
  isLoading: boolean;
  childrens: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate?: any;
}

function ModelButton(props: ModelButtonProps) {
  const [temperatureParam, setTemperature] = useModalParameter(temperature); 
  const [topPParam, setTopP] = useModalParameter(top_p); 
  return (
    <>
      <div className="btn-group btn-sm">
        <button
          className="btn btn-success"
          onClick={() => props.mutate(null)}
          disabled={props.isLoading}
        >
          {props.isLoading
            ? 'Please wait…'
            : props.childrens.length > 0
              ? 'Generate another reply'
              : 'Generate a reply'}
        </button>
        <button 
          type="button" 
          className="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" 
          data-bs-toggle="dropdown" 
          aria-expanded="false" 
          data-bs-reference="parent"
        />
        <form className="dropdown-menu dropdown-menu-lg-start p-2" style={{ width: "fit-content" }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text" style={{ width: "60%" }}>Temperature</span>
            <input id="temperature" type="number" defaultValue={temperatureParam} min={0} max={1} step={0.1} 
              onChange={(e) => {
                setTemperature(convertToNumber(e.target.value));
              }
              } 
              className="form-control"
            />
          </div>
          <div className="input-group input-group-sm pt-2">
            <span className="input-group-text" style={{ width: "60%" }}>Top_P</span>
            <input id="top_p" type="number" defaultValue={topPParam} min={0} max={1} step={0.1} 
              onChange={(e) => {
                setTopP(convertToNumber(e.target.value));
              }
              } className="form-control"/>
          </div>
          <ModelSelector disabled={props.isLoading} />
        </form>
      </div>
    </>
  );
}

export {
  ModelButton
};
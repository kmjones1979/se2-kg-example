import { useState } from "react";
import { ValueType as GraphValueType, Triple } from "@graphprotocol/grc-20";

// Local value type definitions (including RELATION which is used in the UI but handled specially)
type LocalValueType = GraphValueType | "RELATION";

interface TripleOperationsCardProps {
  entityId: string;
  attributeId: string;
  addOperation: (op: any) => void;
  setStatus: (status: string) => void;
  handleGenerateEntityID: () => void;
  handleGenerateAttributeID: () => void;
}

export const TripleOperationsCard = ({
  entityId,
  attributeId,
  addOperation,
  setStatus,
  handleGenerateEntityID,
  handleGenerateAttributeID,
}: TripleOperationsCardProps) => {
  const [textValue, setTextValue] = useState("");
  const [valueType, setValueType] = useState<LocalValueType>("TEXT");
  const [numberValue, setNumberValue] = useState<number | "">("");
  const [urlValue, setUrlValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [pointValue, setPointValue] = useState("");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [relationValue, setRelationValue] = useState("");

  const getCurrentValue = () => {
    switch (valueType) {
      case "TEXT":
        return textValue;
      case "NUMBER":
        return numberValue !== "" ? numberValue.toString() : "";
      case "URL":
        return urlValue;
      case "TIME":
        return timeValue;
      case "POINT":
        return pointValue;
      case "CHECKBOX":
        return checkboxValue.toString();
      case "RELATION":
        return relationValue;
      default:
        return textValue;
    }
  };

  const addTripleOp = () => {
    if (!entityId || !attributeId) {
      setStatus("Entity ID and Attribute ID are required");
      return;
    }

    // Check if the current value type has a value
    const currentValue = getCurrentValue();
    if (currentValue === "" && valueType !== "CHECKBOX") {
      setStatus(`Please fill in a value for ${valueType}`);
      return;
    }

    const setTripleOp = Triple.make({
      entityId,
      attributeId,
      value: {
        type: valueType === "RELATION" ? "TEXT" : valueType,
        value: currentValue,
      },
    });
    addOperation(setTripleOp);
    setStatus(`Added Triple operation with ${valueType} value`);
  };

  const removeTripleOp = () => {
    if (!entityId || !attributeId) {
      setStatus("Entity ID and Attribute ID are required");
      return;
    }

    const deleteTripleOp = Triple.remove({
      entityId,
      attributeId,
    });
    addOperation(deleteTripleOp);
    setStatus(`Added Delete Triple operation`);
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title">Triple Operations</h2>
        <div className="grid gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Entity ID</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateEntityID}>
                Generate
              </button>
            </label>
            <input type="text" placeholder="Entity ID" className="input input-bordered" value={entityId} readOnly />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Attribute ID</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateAttributeID}>
                Generate
              </button>
            </label>
            <input
              type="text"
              placeholder="Attribute ID"
              className="input input-bordered"
              value={attributeId}
              readOnly
            />
          </div>

          {/* Value Type Selector */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Value Type</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={valueType}
              onChange={e => setValueType(e.target.value as LocalValueType)}
            >
              <option value="TEXT">TEXT</option>
              <option value="NUMBER">NUMBER</option>
              <option value="URL">URL</option>
              <option value="TIME">TIME</option>
              <option value="POINT">POINT</option>
              <option value="CHECKBOX">CHECKBOX</option>
              <option value="RELATION">RELATION</option>
            </select>
          </div>

          {/* Dynamic Value Input based on Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Value ({valueType})</span>
            </label>

            {valueType === "TEXT" && (
              <input
                type="text"
                placeholder="Text Value"
                className="input input-bordered"
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
              />
            )}

            {valueType === "NUMBER" && (
              <input
                type="number"
                placeholder="Number Value"
                className="input input-bordered"
                value={numberValue}
                onChange={e => setNumberValue(e.target.value === "" ? "" : Number(e.target.value))}
              />
            )}

            {valueType === "URL" && (
              <input
                type="url"
                placeholder="URL Value (https://example.com)"
                className="input input-bordered"
                value={urlValue}
                onChange={e => setUrlValue(e.target.value)}
              />
            )}

            {valueType === "TIME" && (
              <input
                type="datetime-local"
                className="input input-bordered"
                value={timeValue}
                onChange={e => setTimeValue(e.target.value)}
              />
            )}

            {valueType === "POINT" && (
              <input
                type="text"
                placeholder="Point Value (x,y)"
                className="input input-bordered"
                value={pointValue}
                onChange={e => setPointValue(e.target.value)}
              />
            )}

            {valueType === "CHECKBOX" && (
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={checkboxValue}
                    onChange={e => setCheckboxValue(e.target.checked)}
                  />
                  <span className="label-text">{checkboxValue ? "True" : "False"}</span>
                </label>
              </div>
            )}

            {valueType === "RELATION" && (
              <input
                type="text"
                placeholder="Entity ID to relate to"
                className="input input-bordered"
                value={relationValue}
                onChange={e => setRelationValue(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <button className="btn btn-primary" onClick={addTripleOp}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Triple
            </button>
            <button className="btn btn-secondary" onClick={removeTripleOp}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Remove Triple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

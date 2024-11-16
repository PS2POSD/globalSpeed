import { useState, useRef } from "react"
import { SliderPlus } from "../comps/SliderPlus";
import { FaVolumeUp, FaMusic, FaArrowsAltH } from "react-icons/fa";
import { EqualizerControl } from "./EqualizerControl";
import { useStateView } from "../hooks/useStateView";
import { useCaptureStatus } from "../hooks/useCaptureStatus";
import { MdAccessTime } from "react-icons/md";
import { getDefaultAudioFx } from "../defaults";
import { ReverseButton } from "./ReverseButton";
import { produce } from "immer";
import { initTabCapture, releaseTabCapture } from "src/background/utils/tabCapture";
import "./AudioPanel.css"
import { domRectGetOffset, feedbackText } from "src/utils/helper";

export function AudioPanel(props: {}) {
  const [view, setView] = useStateView({audioFx: true, audioFxAlt: true, monoOutput: true, audioPan: true})
  const env = useRef({viaButton: true}).current
  let [rightTab, setRightTab] = useState(false)
  const status = useCaptureStatus()
  
  if (!view) return <div className="panel unloaded"></div>

  if (!view.audioFxAlt) {
    rightTab = false 
  }
 
  let starAudioFx = rightTab ? view.audioFxAlt : view.audioFx
  let starKey: "audioFxAlt" | "audioFx"  = rightTab ? "audioFxAlt" : "audioFx"

  const ensureCaptured = async () => {
    if (status) return status 
    env.viaButton = false
    return initTabCapture(gvar.tabInfo.tabId)
  }

  return <div className="AudioPanel panel">

    {/* Capture button */}
    <button className={`capture ${status ? "active" : ""}`} onClick={e => {
      env.viaButton = true 
      status ? releaseTabCapture(gvar.tabInfo.tabId) : initTabCapture(gvar.tabInfo.tabId)
    }}>{status ? gvar.gsm.audio.releaseTab : gvar.gsm.audio.captureTab}</button>

    <div className="mainControls">

      {/* Split */}
      <button 
        className={`toggle ${view.audioFxAlt ? "active" : ""}`}
        onClick={() => {
          setView(produce(view, d => {
            d.audioFxAlt = d.audioFxAlt ? null : structuredClone(view.audioFx || getDefaultAudioFx())
          }))
        }}
      >{gvar.gsm.audio.split}</button>

      {/* Mono */}
      <button 
        className={`toggle ${view.monoOutput ? "active" : ""}`}
        onClick={() => {
          setView(produce(view, d => {
            d.monoOutput = !d.monoOutput
            d.monoOutput && ensureCaptured()
          }))
        }}
      >{gvar.gsm.command.afxMono}</button>

    </div>

    {/* Split tabs */}
    {!!view.audioFxAlt && (
      <div className="tabs">
        <button className={!rightTab ? "open" : ""} onClick={e => {
          setRightTab(false)
        }}>{"<< L"}</button>
        <button className={rightTab ? "open" : ""} onClick={e => {
          setRightTab(true)
        }}>{"R >>"}</button>
      </div>
    )}

    {/* Pitch control */}
    <SliderPlus
      label={<div>
        <FaMusic size="1.21rem"/>
        <span style={{marginLeft: "10px"}}>{gvar.gsm.command.afxPitch}</span>
        <button title={"high quality"} style={{marginLeft: "10px"}} className={`micro toggle ${starAudioFx.jungleMode ? "" : "active"}`} onClick={e => {
          setView(produce(view, d => {
            d[starKey].jungleMode = !starAudioFx.jungleMode
          }))
        }}>HD</button>
      </div>}
      value={starAudioFx.pitch ?? 1}
      sliderMin={-6}
      sliderMax={6}
      min={-100}
      max={100}
      sliderStep={0.1}
      default={0}
      onChange={newValue => {
        setView(produce(view, d => {
          d[starKey].pitch = newValue 
        }))
        newValue !== 0 && ensureCaptured()
      }}
    />

    {/* Gain control */}
    <SliderPlus
      label={<div>
        <FaVolumeUp size="1.21rem"/>
        <span style={{marginLeft: "10px"}}>{gvar.gsm.command.afxGain}</span>
      </div>}
      value={starAudioFx.volume ?? 1}
      sliderMin={0}
      sliderMax={3}
      min={0}
      default={1}
      onChange={newValue => {
        setView(produce(view, d => {
          d[starKey].volume = newValue 
        }))
        newValue !== 1 && ensureCaptured()
      }}
    />

    {/* Pan control */}
    <SliderPlus
      label={<div>
        <FaArrowsAltH size="1.21rem"/>
        <span style={{marginLeft: "10px"}}>{gvar.gsm.command.afxPan}</span>
      </div>}
      value={view.audioPan ?? 0}
      sliderMin={-1}
      sliderMax={1}
      min={-1}
      default={0}
      onChange={newValue => {
        setView(produce(view, d => {
          d.audioPan = newValue
        }))
        newValue !== 0 && ensureCaptured()
      }}
    />

    {/* Delay control */}
    <SliderPlus
      label={<div>
        <MdAccessTime size="1.42rem"/>
        <span style={{marginLeft: "10px"}}>{gvar.gsm.command.afxDelay}</span>
        <button style={{marginLeft: "10px"}} className={`toggle ${starAudioFx.delayMerge ? "active" : ""}`} onClick={e => {
          setView(produce(view, d => {
            d[starKey].delayMerge = !starAudioFx.delayMerge
            if(d[starKey].delayMerge) feedbackText(gvar.gsm.token.mergeBoth, domRectGetOffset((e.currentTarget as any as HTMLButtonElement).getBoundingClientRect(), 8, 30))
          }))
        }}>+</button>
      </div>}
      value={starAudioFx.delay ?? 0}
      sliderMin={0}
      sliderMax={5}
      min={0}
      max={179}
      default={0}
      onChange={newValue => {
        setView(produce(view, d => {
          d[starKey].delay = newValue 
        }))
        newValue !== 0 && ensureCaptured()
      }}
    />

    {/* Reverse */}
    {<ReverseButton onActivate={ensureCaptured}/>}

    {/* EQ */}
    <EqualizerControl value={starAudioFx.eq} onChange={newValue => {
      setView(produce(view, d => {
        d[starKey].eq = newValue
      }))
      newValue.enabled && ensureCaptured()
    }}/>
  </div>
}
import { Root, createRoot } from "react-dom/client"
import { SectionFlags } from "./SectionFlags"
import { SectionEditor } from "./SectionEditor"
import { SectionHelp } from "./SectionHelp"
import { SectionRules } from "./SectionRules"
import { ErrorFallback } from "../comps/ErrorFallback"
import { useThemeSync } from "src/hooks/useThemeSync"
import { loadGsm } from "src/utils/gsm"
import "./options.css"
import { requestCreateTab, requestTabInfo } from "src/utils/browserUtils"
import type { Indicator } from "src/contentScript/isolated/utils/Indicator"
import { useStateView } from "src/hooks/useStateView"
import { isEdge, isFirefox, isMobile } from "src/utils/helper"
import { GoX } from "react-icons/go"

declare global {
  interface Window {
    root?: Root
    
  }

  interface GlobalVar {
    indicator?: Indicator,
    isOptionsPage?: boolean
  }
}

const Options = (props: {}) => {
  useThemeSync()
  return <div id="App">
    <SectionFlags/>
    <SectionEditor/>
    <SectionRules/>
    <SectionHelp/>
  </div>
}

if (isMobile())  document.documentElement.classList.add("mobile") 
Promise.all([loadGsm(), requestTabInfo()]).then(([gsm, tabInfo]) => {
  gvar.isOptionsPage = true 
  gvar.gsm = gsm 
  gvar.tabInfo = tabInfo 
  document.documentElement.lang = gsm._lang
  window.root = createRoot(document.querySelector("#root"))
  window.root.render(<ErrorFallback><Options/></ErrorFallback>)
})

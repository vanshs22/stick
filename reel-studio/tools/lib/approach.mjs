// The semantic visual director's vocabulary: what KIND of picture carries a narration line, and which renderers legitimately do that job.
export const APPROACHES = ['screenshot', 'designed-ui', 'motion-graphics', 'character-3d', 'physical-3d', 'metaphor-env', 'data-viz', 'evidence-card', 'combo'];
/** approach -> components that can carry it ('Stage3D' covers all the 3D approaches; what differs is what is IN the 3D scene) */
export const CARRIERS = {
  screenshot: ['BrowserWindow', 'ProofCard', 'PhoneFrame', 'EvidenceCard', 'Stage3D', 'RepoCard', 'ProfileCard', 'HtmlBlock'],
  'evidence-card': ['ProofCard', 'BrowserWindow', 'EvidenceCard', 'RepoCard', 'ProfileCard', 'Ledger', 'NotebookPage', 'Stage3D', 'HtmlBlock'],
  'designed-ui': ['Terminal', 'ChatBubbles', 'CommentBox', 'FileList', 'RepoCard', 'Checklist', 'Ledger', 'PhoneFrame', 'ProfileCard', 'EndCard', 'HtmlBlock', 'FlowDiagram', 'Versus'],
  'motion-graphics': ['TitleCard', 'BigStat', 'Typewriter', 'Stamp', 'Highlight', 'KineticList', 'Timeline', 'Versus', 'RouteMap', 'FlowDiagram', 'RemocnBlock', 'HtmlBlock', 'EndCard', 'Checklist', 'BarChart', 'LineChart'],
  'data-viz': ['BarChart', 'LineChart', 'Timeline', 'BigStat', 'RouteMap', 'Versus', 'RemocnBlock', 'HtmlBlock', 'Stage3D'],
  'character-3d': ['Stage3D', 'Scene3D'], 'physical-3d': ['Stage3D', 'Scene3D'], 'metaphor-env': ['Stage3D', 'Scene3D', 'RouteMap', 'HtmlBlock'],
  combo: null,   // any renderer, but the shot must list >= 2 layers in `layers`
};
/** components whose picture is mostly the words themselves: they may not just repeat the narration */
export const TEXT_ONLY = new Set(['TitleCard', 'KineticList', 'Highlight', 'Typewriter', 'Stamp']);
export const defaultApproach = (component, shot = {}) => component === 'Stage3D' || component === 'Scene3D' ? ((shot.props?.cast || []).length ? 'character-3d' : 'physical-3d')
  : ['BrowserWindow', 'ProofCard', 'PhoneFrame', 'EvidenceCard'].includes(component) ? 'screenshot' : ['BarChart', 'LineChart', 'Timeline', 'BigStat'].includes(component) ? 'data-viz'
  : ['Terminal', 'ChatBubbles', 'CommentBox', 'FileList', 'RepoCard', 'ProfileCard', 'Ledger', 'Checklist', 'EndCard', 'Versus'].includes(component) ? 'designed-ui' : 'motion-graphics';

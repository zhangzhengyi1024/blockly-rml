import type { BlocklyOptions, Events, WorkspaceSvg } from 'blockly';
import * as Blockly from 'blockly';
import { Component, createRef, CSSProperties } from 'react';
import type { CustomMenuOptions } from './context-menu-types';

export interface WorkspaceChangeCallback {
  (evt: Events.Abstract): void;
}

export type RegistryType = Parameters<typeof Blockly.registry.register>;

export interface BlocklyContainerProps {
  /** 注入 Blockly 时的配置，只在初始化时生效 */
  blocklyOptions: BlocklyOptions;
  /** 自定义 block 的定义 */
  customBlocks?: Record<string, unknown>[];
  /** 自定义右键菜单 */
  customMenuOptions?: CustomMenuOptions;
  initialWorkspace?: string;
  registryItems?: RegistryType[];
  /** 工作区发生改变时的回调函数 */
  onWorkspaceChange?: WorkspaceChangeCallback;
  className?: string;
}

const style: CSSProperties = {
  height: '100%',
  userSelect: 'none',
};

class BlocklyContainer extends Component<BlocklyContainerProps> {
  container = createRef<HTMLDivElement>();
  mainWorkspace!: WorkspaceSvg;

  componentDidMount() {
    const blocklyDiv = this.container.current;
    if (!blocklyDiv) {
      return;
    }

    const {
      blocklyOptions,
      customBlocks,
      initialWorkspace,
      onWorkspaceChange,
      registryItems,
    } = this.props;

    this.registerCustomMenuOptions();
    registryItems?.forEach(item => Blockly.registry.register(...item));
    if (customBlocks) {
      Blockly.defineBlocksWithJsonArray(customBlocks);
    }

    this.mainWorkspace = Blockly.inject(blocklyDiv, blocklyOptions);
    if (initialWorkspace) {
      Blockly.Xml.domToWorkspace(
        Blockly.Xml.textToDom(initialWorkspace),
        this.mainWorkspace
      );
    }
    if (onWorkspaceChange) {
      this.mainWorkspace.addChangeListener(onWorkspaceChange);
    }
  }

  private registerCustomMenuOptions() {
    const { customMenuOptions } = this.props;
    if (!customMenuOptions) {
      return;
    }

    const { blockMenuItems, workspaceMenuItems } = customMenuOptions;
    const { ScopeType, registry } = Blockly.ContextMenuRegistry;

    blockMenuItems.forEach(item =>
      registry.register({ ...item, scopeType: ScopeType.BLOCK })
    );
    workspaceMenuItems.forEach(item => {
      registry.register({ ...item, scopeType: ScopeType.WORKSPACE });
    });
  }

  render() {
    const { className } = this.props;
    return <div className={className} style={style} ref={this.container}></div>;
  }
}

export default BlocklyContainer;

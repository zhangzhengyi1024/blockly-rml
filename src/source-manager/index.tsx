import { uploadFile } from '@/utils';
import { addSource, connect, removeSource } from '@stores';
import { Filetype, mimeTypes } from '@stores/types';
import { Modal, Tabs, TabsProps } from 'antd';
import { Component } from 'react';
import { ConnectedProps } from 'react-redux';
import './index.less';
import { CSVViewer, JSONViewer } from './source-viewer';

const { TabPane } = Tabs;

type TabEditEvent = Exclude<TabsProps['onEdit'], undefined>;

const mimeTypeString = mimeTypes.join(',');

/** 重复文件检查的结果 */
enum DuplicateFileCheck {
  /** 添加新文件 */
  add = 0,
  /** 覆盖已有的文件 */
  overwrite = 1,
  /** 取消操作 */
  cancel = 2,
}

interface SourceManagerState {
  activeKey?: string;
}

class SourceManager extends Component<SourceManagerProps, SourceManagerState> {
  state: Readonly<SourceManagerState> = {};

  private setActiveKey = (activeKey: string) => {
    this.setState({ activeKey });
  };

  private handleUpload = async (file: File) => {
    const checkResult = await this.checkDuplicateFile(file);
    if (checkResult === DuplicateFileCheck.cancel) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const { addSource } = this.props;
      const content = reader.result as string;
      if (file.type === Filetype.CSV) {
        const structure = content.split('\n')[0].split(',');
        addSource({
          filename: file.name,
          content,
          filetype: file.type,
          structure,
        });
      } else if (file.type === Filetype.JSON) {
        addSource({
          filename: file.name,
          content,
          filetype: file.type,
          structure: JSON.parse(content),
        });
      }
    };
    reader.readAsText(file);
  };

  private onEdit: TabEditEvent = async (target, action) => {
    const { removeSource } = this.props;
    if (action === 'add') {
      const file = await uploadFile(mimeTypeString);
      if (file !== undefined) {
        this.handleUpload(file);
      }
    } else if (typeof target === 'string') {
      removeSource(target);
    }
  };

  /** 检查是否有与导入的文件同名的文件，如果有，询问用户下一步的操作 */
  private checkDuplicateFile = (newFile: File) => {
    const { files } = this.props;
    return new Promise<DuplicateFileCheck>(resolve => {
      if (files.findIndex(file => file.filename === newFile.name) === -1) {
        resolve(DuplicateFileCheck.add);
      } else {
        Modal.confirm({
          title: '替换或跳过文件',
          content: `文件库中已存在名为 ${newFile.name} 的文件`,
          okText: '取消载入文件',
          onOk: () => resolve(DuplicateFileCheck.cancel),
          cancelText: '替换已有的文件',
          onCancel: () => resolve(DuplicateFileCheck.overwrite),
        });
      }
    });
  };

  render() {
    const { activeKey } = this.state;
    const { files } = this.props;
    return (
      <Tabs
        className="source-manager"
        type="editable-card"
        activeKey={activeKey}
        onChange={this.setActiveKey}
        onEdit={this.onEdit}
      >
        {files.map(file => (
          <TabPane key={file.filename} tab={file.filename}>
            {file.filetype === Filetype.CSV ? (
              <CSVViewer structure={file.structure} />
            ) : (
              <JSONViewer structure={file.structure} />
            )}
          </TabPane>
        ))}
      </Tabs>
    );
  }
}

const sourceManagerWrapper = connect(
  store => ({
    files: store.source,
  }),
  {
    addSource,
    removeSource,
  }
);

type SourceManagerProps = ConnectedProps<typeof sourceManagerWrapper>;

export default sourceManagerWrapper(SourceManager);

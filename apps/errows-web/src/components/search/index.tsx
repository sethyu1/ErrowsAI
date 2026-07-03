/*
这是一个移动端搜索服务组件，配合hooks更容易使用
暂时只提供hooks模式
*/
import React from "react";
import {
  Drawer,
  DrawerContent,
} from "@errows/design/components/drawer";
import { BackIcon, SearchIcon } from "@errows/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@errows/design";
import { useModal } from "@/hooks/use-modal";
import { useDebounce } from "ahooks";

interface UseSearchOptions {
  onSearch?: (value: string) => void;
  debounceWait?: number;
}

export const useSearch = (options?: UseSearchOptions) => {
  const { onSearch, debounceWait = 500 } = options || {};
  const { open, close, visible } = useModal();
  const [searchText, setSearchText] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  
  // 防抖处理搜索输入
  const debouncedSearchValue = useDebounce(searchValue, { wait: debounceWait });

  // 当防抖后的值变化时，触发搜索回调
  // React.useEffect(() => {
  //   if (visible && onSearch) {
  //     onSearch(debouncedSearchValue);
  //   }
  // }, [debouncedSearchValue, visible, onSearch]);

  // 关闭时清空搜索
  // const handleClose = React.useCallback(() => {
  //   setSearchValue("");
  //   close();
  // }, [close]);

  const content = React.useMemo(() => {
    return (
      <Drawer
        open={visible}
        onOpenChange={close}
        dismissible={false}
        direction="right"
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-screen h-screen z-1000 bg-[#1b1227]">
          <div className="flex items-center h-[72px] gap-4 border-b border-[#2C2C38] pr-7 pl-5">
            <BackIcon className="w-5 h-5" onClick={close}/>
            <InputGroup className="rounded-full">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search"
                className="h-[38px]"
                style={{ background: "none" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </InputGroup>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }, [visible, searchText]);

  return {
    open,
    close,
    content,
    searchText,
    setSearchText,
  };
};

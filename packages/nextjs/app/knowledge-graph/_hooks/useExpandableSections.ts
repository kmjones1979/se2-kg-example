import { useState } from "react";

/**
 * Default sections that can be expanded/collapsed
 */
export interface ExpandableSections {
  tripleSection: boolean;
  operationsLog: boolean;
  publishCard: boolean;
  aboutIds: boolean;
  knowledgeGraphs: boolean;
  [key: string]: boolean;
}

/**
 * Custom hook to manage expandable sections in the UI
 *
 * @param initialState - The initial state of the expandable sections
 * @returns - Methods to manage expandable sections
 */
export const useExpandableSections = (initialState?: Partial<ExpandableSections>) => {
  const defaultState: ExpandableSections = {
    tripleSection: true,
    operationsLog: true,
    publishCard: true,
    aboutIds: true,
    knowledgeGraphs: true,
    ...initialState,
  };

  const [expandedSections, setExpandedSections] = useState<ExpandableSections>(defaultState);

  /**
   * Toggle a specific section's expanded state
   */
  const toggleSection = (sectionKey: keyof ExpandableSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  /**
   * Check if a section is expanded
   */
  const isSectionExpanded = (sectionKey: keyof ExpandableSections): boolean => {
    return expandedSections[sectionKey];
  };

  /**
   * Expand all sections
   */
  const expandAll = () => {
    const allExpanded: ExpandableSections = { ...expandedSections };
    Object.keys(allExpanded).forEach(key => {
      allExpanded[key] = true;
    });
    setExpandedSections(allExpanded);
  };

  /**
   * Collapse all sections
   */
  const collapseAll = () => {
    const allCollapsed: ExpandableSections = { ...expandedSections };
    Object.keys(allCollapsed).forEach(key => {
      allCollapsed[key] = false;
    });
    setExpandedSections(allCollapsed);
  };

  return {
    expandedSections,
    toggleSection,
    isSectionExpanded,
    expandAll,
    collapseAll,
  };
};

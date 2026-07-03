/**
 * @fileoverview Notion related actions
 * @module services/libs/notion
 * @description Provides functionality to fetch blog articles from Notion database
 */

import { Client, isFullDatabase } from '@notionhq/client';
import config from 'config';
import moleculer from 'moleculer';

const { MoleculerClientError } = moleculer.Errors;

/**
 * Extract Notion property value
 * @param {Object} property - Notion property object
 * @returns {string|null} Extracted value
 */
function extractPropertyValue(property) {
  if (!property) return null;

  switch (property.type) {
    case 'title':
      return property.title?.[0]?.plain_text || null;
    case 'rich_text':
      return property.rich_text?.map(rt => rt.plain_text).join('') || null;
    case 'date':
      return property.date?.start || null;
    case 'files':
      const file = property.files?.[0];
      if (file?.type === 'external') {
        return file.external?.url || null;
      } else if (file?.type === 'file') {
        return file.file?.url || null;
      }
      return null;
    default:
      return null;
  }
}

const NOTION_COLOR_MAP = {
  default: {},
  gray: { color: '#9B9A97' },
  brown: { color: '#64473A' },
  orange: { color: '#D9730D' },
  yellow: { color: '#DFAB01' },
  green: { color: '#0F7B6C' },
  blue: { color: '#0B6E99' },
  purple: { color: '#6940A5' },
  pink: { color: '#AD1A72' },
  red: { color: '#E03E3E' },
  gray_background: { backgroundColor: '#EBECED', color: '#37352F' },
  brown_background: { backgroundColor: '#E9E5E3', color: '#64473A' },
  orange_background: { backgroundColor: '#FAEBDD', color: '#D9730D' },
  yellow_background: { backgroundColor: '#FBF3DB', color: '#DFAB01' },
  green_background: { backgroundColor: '#DDEDEA', color: '#0F7B6C' },
  blue_background: { backgroundColor: '#DDEBF1', color: '#0B6E99' },
  purple_background: { backgroundColor: '#EAE4F2', color: '#6940A5' },
  pink_background: { backgroundColor: '#F4DFEB', color: '#AD1A72' },
  red_background: { backgroundColor: '#FBE4E4', color: '#E03E3E' },
};

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function richTextToHtml(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map((rt) => {
    const text = escapeHtml(rt.plain_text || '');
    if (!text) return '';
    const ann = rt.annotations || {};
    const styles = {};
    if (ann.color && NOTION_COLOR_MAP[ann.color]) {
      Object.assign(styles, NOTION_COLOR_MAP[ann.color]);
    }
    const styleStr = Object.entries(styles)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');
    const wrap = (s) => {
      let r = s;
      if (ann.bold) r = `<b>${r}</b>`;
      if (ann.italic) r = `<i>${r}</i>`;
      if (ann.underline) r = `<u>${r}</u>`;
      if (ann.strikethrough) r = `<s>${r}</s>`;
      return r;
    };
    const href = rt.href || (rt.text && rt.text.link && rt.text.link.url);
    const inner = href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">${wrap(text)}</a>` : wrap(text);
    if (ann.code) {
      return `<code class="notion-inline-code"${styleStr ? ` style="${escapeHtml(styleStr)}"` : ''}>${inner}</code>`;
    }
    return `<span${styleStr ? ` style="${escapeHtml(styleStr)}"` : ''}>${inner}</span>`;
  }).join('');
}

async function fetchAllBlocks(notion, blockId) {
  const allBlocks = [];
  let cursor;
  do {
    const params = { block_id: blockId, page_size: 100 };
    if (cursor) params.start_cursor = cursor;
    const response = await notion.blocks.children.list(params);
    allBlocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return allBlocks;
}

/**
 * Notion table blocks use child `table_row` blocks; each row has `cells: rich_text[][]`.
 */
function tableRowsToPlain(rowBlocks) {
  if (!rowBlocks.length) return '';
  return rowBlocks
    .map((row) => {
      const cells = row.table_row?.cells || [];
      return cells.map((cell) => (cell || []).map((rt) => rt.plain_text).join('')).join('\t');
    })
    .join('\n');
}

function buildTableHtml(table, rowBlocks) {
  if (!table || !rowBlocks.length) return '';

  const colHeader = !!table.has_column_header;
  const rowHeader = !!table.has_row_header;

  const cellHtml = (cellRich, tag, extraAttr = '') => {
    const inner = richTextToHtml(cellRich || []);
    const safe = inner || '\u00a0';
    return `<${tag}${extraAttr}>${safe}</${tag}>`;
  };

  const renderBodyRow = (rowBlock) => {
    const cells = rowBlock.table_row?.cells || [];
    return `<tr>${cells
      .map((cellRich, colIndex) => {
        if (rowHeader && colIndex === 0) {
          return cellHtml(cellRich, 'th', ' scope="row"');
        }
        return cellHtml(cellRich, 'td');
      })
      .join('')}</tr>`;
  };

  let html = '<div class="notion-table-wrap"><table class="notion-table">';
  let bodyStart = 0;
  if (colHeader) {
    const cells = rowBlocks[0].table_row?.cells || [];
    html += '<thead><tr>';
    html += cells.map((cellRich) => cellHtml(cellRich, 'th')).join('');
    html += '</tr></thead>';
    bodyStart = 1;
  }
  if (bodyStart < rowBlocks.length) {
    html += '<tbody>';
    for (let i = bodyStart; i < rowBlocks.length; i++) {
      html += renderBodyRow(rowBlocks[i]);
    }
    html += '</tbody>';
  }
  html += '</table></div>';
  return html;
}

function generateHeadingId(text, counts) {
  const baseId = text.toLowerCase()
    .replace(/[^a-z0-9一-鿿぀-ゟ゠-ヿ]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'heading';
  counts[baseId] = (counts[baseId] || 0) + 1;
  return counts[baseId] > 1 ? `${baseId}-${counts[baseId]}` : baseId;
}

async function extractPageContent(notion, pageId) {
  try {
    const blocks = await fetchAllBlocks(notion, pageId);

    // Pre-collect headings so table_of_contents block can generate real TOC HTML
    const tocHeadings = [];
    const tocIdCounts = {};
    for (const block of blocks) {
      if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
        const prop = block[block.type];
        const text = prop?.rich_text?.map(rt => rt.plain_text).join('') || '';
        if (text) {
          const level = parseInt(block.type.slice(-1));
          const id = generateHeadingId(text, tocIdCounts);
          tocHeadings.push({ id, text, level });
        }
      }
    }

    const buildTocHtml = () => {
      if (!tocHeadings.length) return '';
      const items = tocHeadings.map(h =>
        `<li class="notion-toc-item notion-toc-level-${h.level}"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`
      ).join('');
      return `<nav class="notion-toc"><ul>${items}</ul></nav>`;
    };

    let content = '';
    let contentHtml = '';
    const images = [];
    const headingIdCounts = {};

    for (const block of blocks) {
      if (block.type === 'paragraph') {
        const rich = block.paragraph?.rich_text;
        const text = rich?.map(rt => rt.plain_text).join('') || '';
        if (text) {
          content += text + '\n\n';
          contentHtml += `<p class="notion-paragraph">${richTextToHtml(rich)}</p>`;
        }
      } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
        const prop = block[block.type];
        const rich = prop?.rich_text;
        const heading = rich?.map(rt => rt.plain_text).join('') || '';
        if (heading) {
          content += heading + '\n\n';
          const tag = block.type === 'heading_1' ? 'h1' : block.type === 'heading_2' ? 'h2' : 'h3';
          const id = generateHeadingId(heading, headingIdCounts);
          contentHtml += `<${tag} id="${escapeHtml(id)}" class="notion-${block.type}">${richTextToHtml(rich)}</${tag}>`;
        }
      } else if (block.type === 'table_of_contents') {
        contentHtml += buildTocHtml();
      } else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        const prop = block[block.type];
        const rich = prop?.rich_text;
        const text = rich?.map(rt => rt.plain_text).join('') || '';
        if (text) {
          content += '• ' + text + '\n';
          contentHtml += `<li class="notion-${block.type}">${richTextToHtml(rich)}</li>`;
        }
      } else if (block.type === 'image') {
        const imageBlock = block.image;
        let imageUrl = null;
        
        if (imageBlock.external) {
          imageUrl = imageBlock.external.url;
        } else if (imageBlock.file) {
          imageUrl = imageBlock.file.url;
        }
        
        if (imageUrl) {
          const caption = imageBlock.caption
            ?.map(rt => rt.plain_text)
            .join('') || '';
          
          images.push({
            url: imageUrl,
            caption: caption || null
          });
          
          content += `[IMAGE:${images.length - 1}]\n\n`;
          contentHtml += `[IMAGE:${images.length - 1}]`;
        }
      } else if (block.type === 'table' && block.table) {
        const rowBlocks = (await fetchAllBlocks(notion, block.id)).filter((b) => b.type === 'table_row');
        const tablePlain = tableRowsToPlain(rowBlocks);
        if (tablePlain) {
          content += tablePlain + '\n\n';
        }
        const tableHtml = buildTableHtml(block.table, rowBlocks);
        if (tableHtml) {
          contentHtml += tableHtml;
        }
      }

      if (block.has_children && block.type !== 'table') {
        const childResult = await extractPageContent(notion, block.id);
        if (childResult.text) content += childResult.text;
        if (childResult.contentHtml) contentHtml += childResult.contentHtml;
        if (childResult.images && childResult.images.length > 0) {
          const startIndex = images.length;
          images.push(...childResult.images);
          content = content.replace(/\[IMAGE:(\d+)\]/g, (match, index) => {
            return `[IMAGE:${parseInt(index) + startIndex}]`;
          });
          contentHtml = contentHtml.replace(/\[IMAGE:(\d+)\]/g, (match, index) => {
            return `[IMAGE:${parseInt(index) + startIndex}]`;
          });
        }
      }
    }

    return {
      text: content.trim(),
      contentHtml: contentHtml.trim(),
      images: images
    };
  } catch (error) {
    console.error('Error extracting page content:', error);
    return { text: '', contentHtml: '', images: [] };
  }
}

/**
 * Notion related Moleculer Actions
 * @type {Object}
 */
export default {
  /**
   * Get Notion blog articles list
   * @action notion_blog_list
   * @param {Object} ctx.params
   * @param {number} ctx.params.limit - Number of articles to fetch, default 3
   * @returns {Promise<Array>} Blog articles list
   * @returns {string} return[].id - Article ID
   * @returns {string} return[].title - Article title
   * @returns {string} return[].thumbnail - Thumbnail URL
   * @returns {string} return[].date - Publish date
   * @returns {string} return[].content - Article content (summary)
   */
  notion_blog_list: {
    params: {
      limit: {
        type: 'number',
        integer: true,
        optional: true,
        default: 3,
        minimum: 1,
        maximum: 10,
        convert: true
      }
    },
    async handler(ctx) {
      const { limit = 3 } = ctx.params;
      const notionConfig = config.notion;

      if (!notionConfig?.apiKey || !notionConfig?.databaseId) {
        throw new MoleculerClientError(
          'Notion configuration is missing',
          500,
          'NOTION_CONFIG_MISSING'
        );
      }

      try {
        const notion = new Client({ auth: notionConfig.apiKey });

        let databaseId = notionConfig.databaseId.trim();
        
        if (!databaseId.includes('-') && databaseId.length === 32) {
          databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
        } else if (databaseId.includes('-')) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(databaseId)) {
            throw new MoleculerClientError(
              `Invalid Notion database ID format. Expected UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got: ${notionConfig.databaseId}`,
              400,
              'INVALID_DATABASE_ID'
            );
          }
        } else {
          throw new MoleculerClientError(
            `Invalid Notion database ID format. Expected 32 characters or UUID format, got: ${notionConfig.databaseId}`,
            400,
            'INVALID_DATABASE_ID'
          );
        }

        let database;
        try {
          database = await notion.databases.retrieve({
            database_id: databaseId,
          });
          
          // console.log('Notion database retrieved:', {
          //   id: database?.id,
          //   object: database?.object,
          //   hasProperties: 'properties' in database,
          //   propertiesCount: database?.properties ? Object.keys(database.properties).length : 0,
          //   propertyNames: database?.properties ? Object.keys(database.properties) : []
          // });
        } catch (error) {
          let errorMessage = error.message || 'Unknown error';
          
          if (errorMessage.includes('Could not find database')) {
            errorMessage = `Could not find Notion database. Please check:
1. Database ID is correct: ${notionConfig.databaseId}
2. Database is shared with your Notion Integration
3. Integration has access permissions

How to get Database ID:
- Open your Notion database page
- Check browser address bar, URL format: https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- The last 32 characters are the Database ID

How to share database with Integration:
- Click "..." menu in the top right of database page
- Select "Connections" or "Add connections"
- Search and select your Integration name`;
          }
          
          throw new MoleculerClientError(
            `Failed to retrieve Notion database: ${errorMessage}`,
            500,
            'NOTION_DATABASE_ERROR',
            { originalError: error.message, databaseId: notionConfig.databaseId }
          );
        }

        if (!isFullDatabase(database)) {
          console.error('Database object is not a full database:', {
            databaseId: database?.id,
            databaseObject: database?.object,
            databaseKeys: database ? Object.keys(database) : []
          });
          
          throw new MoleculerClientError(
            `Notion database is not accessible. The database object returned is not a full database object. This usually means:
1. The database is not shared with your Integration
2. The Integration does not have read permissions for this database
3. The database ID is incorrect

Please check:
- Database ID: ${notionConfig.databaseId} (formatted as: ${databaseId})
- Go to your Notion database page
- Click the "..." menu in the top right
- Select "Connections" or "Add connections"
- Search for and select your Integration name
- Make sure the Integration has "Read content" and "Read database" permissions`,
            500,
            'NOTION_DATABASE_INACCESSIBLE',
            {
              databaseId: notionConfig.databaseId,
              formattedDatabaseId: databaseId,
              databaseObject: database
            }
          );
        }

        let propertyNames = [];
        if (database.properties && typeof database.properties === 'object') {
          propertyNames = Object.keys(database.properties);
        }

        const findProperty = (names, availableNames) => {
          if (!availableNames || availableNames.length === 0) return null;
          for (const name of names) {
            if (availableNames.includes(name)) return name;
            const found = availableNames.find(p => p.toLowerCase() === name.toLowerCase());
            if (found) return found;
          }
          return null;
        };

        let titlePropName = null;
        let datePropName = null;
        let thumbnailPropName = null;

        if (propertyNames.length > 0) {
          titlePropName = findProperty(['title', 'Title', 'name', 'Name'], propertyNames) || propertyNames[0];
          datePropName = findProperty(['date', 'Date', 'created_time', 'Created Time'], propertyNames);
          thumbnailPropName = findProperty(['thumbnail', 'Thumbnail', 'cover', 'Cover', 'image', 'Image'], propertyNames);
        }

        let dataSourceId = null;
        if (database.data_sources && Array.isArray(database.data_sources) && database.data_sources.length > 0) {
          dataSourceId = database.data_sources[0].id;
          // console.log('Using data source ID:', dataSourceId);
        }

        const sorts = [];
        if (datePropName) {
          sorts.push({
            property: datePropName,
            direction: 'descending',
          });
        } else {
          sorts.push({
            timestamp: 'created_time',
            direction: 'descending',
          });
        }

        let response;
        if (dataSourceId) {
          response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            sorts,
            page_size: limit,
          });
        } else {
          try {
            response = await notion.databases.query({
              database_id: databaseId,
              sorts,
              page_size: limit,
            });
          } catch (error) {
            throw new MoleculerClientError(
              `Cannot query database. The database may not have a data source configured. Error: ${error.message}`,
              500,
              'NOTION_QUERY_ERROR',
              { originalError: error.message }
            );
          }
        }

        if (propertyNames.length === 0 && response.results.length > 0) {
          const firstPage = response.results[0];
          if (firstPage && 'properties' in firstPage && firstPage.properties) {
            propertyNames = Object.keys(firstPage.properties);
            console.log('Inferred property names from query results:', propertyNames);
            
            titlePropName = findProperty(['title', 'Title', 'name', 'Name'], propertyNames) || propertyNames[0];
            datePropName = findProperty(['date', 'Date', 'created_time', 'Created Time'], propertyNames);
            thumbnailPropName = findProperty(['thumbnail', 'Thumbnail', 'cover', 'Cover', 'image', 'Image'], propertyNames);
          }
        }

        if (propertyNames.length === 0) {
          throw new MoleculerClientError(
            'Cannot determine database properties. Please ensure your Notion database has at least one property and is properly shared with your Integration.',
            500,
            'NOTION_NO_PROPERTIES'
          );
        }

        const articles = [];

        for (const page of response.results) {
          if (!('properties' in page) || !page.properties) continue;

          const properties = page.properties;
          
          const title = titlePropName ? extractPropertyValue(properties[titlePropName]) : null;
          const thumbnail = thumbnailPropName ? extractPropertyValue(properties[thumbnailPropName]) : null;
          const date = datePropName ? extractPropertyValue(properties[datePropName]) : null;

          const finalTitle = title || 'Untitled';

          let content = '';
          try {
            const contentResult = await extractPageContent(notion, page.id);
            let cleanText = contentResult.text.replace(/\[IMAGE:\d+\]\s*/g, '');
            content = cleanText.substring(0, 200);
            if (cleanText.length > 200) {
              content += '...';
            }
          } catch (error) {
            console.error(`Error getting content for page ${page.id}:`, error);
          }

          articles.push({
            id: page.id,
            title: finalTitle,
            thumbnail,
            date,
            content,
          });
        }

        return articles;
      } catch (error) {
        console.error('Error fetching Notion blog articles:', error);
        
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorType = error?.type || 'NOTION_FETCH_ERROR';
        
        if (error.name === 'MoleculerClientError' || error.type) {
          throw error;
        }
        
        throw new MoleculerClientError(
          `Failed to fetch Notion articles: ${errorMessage}`,
          500,
          errorType,
          { 
            originalError: errorMessage,
            errorName: error?.name,
            errorStack: error?.stack
          }
        );
      }
    }
  },

  /**
   * Get Notion blog article detail
   * @action notion_blog_get
   * @param {Object} ctx.params
   * @param {string} ctx.params.pageId - Article page ID
   * @returns {Promise<Object>} Blog article detail
   * @returns {string} return.id - Article ID
   * @returns {string} return.title - Article title
   * @returns {string} return.thumbnail - Thumbnail URL
   * @returns {string} return.date - Publish date
   * @returns {string} return.content - Full article content
   */
  notion_blog_get: {
    params: {
      pageId: { type: 'string', min: 1 }
    },
    async handler(ctx) {
      const { pageId } = ctx.params;
      const notionConfig = config.notion;

      if (!notionConfig?.apiKey || !notionConfig?.databaseId) {
        throw new MoleculerClientError(
          'Notion configuration is missing',
          500,
          'NOTION_CONFIG_MISSING'
        );
      }

      try {
        const notion = new Client({ auth: notionConfig.apiKey });

        let formattedPageId = pageId.trim();
        
        if (!formattedPageId.includes('-') && formattedPageId.length === 32) {
          formattedPageId = `${formattedPageId.slice(0, 8)}-${formattedPageId.slice(8, 12)}-${formattedPageId.slice(12, 16)}-${formattedPageId.slice(16, 20)}-${formattedPageId.slice(20)}`;
        }

        let page;
        try {
          page = await notion.pages.retrieve({
            page_id: formattedPageId,
          });
        } catch (error) {
          throw new MoleculerClientError(
            `Failed to retrieve Notion page: ${error.message}`,
            404,
            'NOTION_PAGE_NOT_FOUND',
            { originalError: error.message, pageId: formattedPageId }
          );
        }

        if (!('properties' in page) || !page.properties) {
          throw new MoleculerClientError(
            'Page properties are not accessible',
            500,
            'NOTION_PAGE_INACCESSIBLE'
          );
        }

        let database;
        try {
          database = await notion.databases.retrieve({
            database_id: notionConfig.databaseId,
          });
        } catch (error) {
          console.warn('Could not retrieve database, using page properties directly');
        }

        const propertyNames = database && 'properties' in database 
          ? Object.keys(database.properties)
          : Object.keys(page.properties);

        const findProperty = (names, availableNames) => {
          if (!availableNames || availableNames.length === 0) return null;
          for (const name of names) {
            if (availableNames.includes(name)) return name;
            const found = availableNames.find(p => p.toLowerCase() === name.toLowerCase());
            if (found) return found;
          }
          return null;
        };

        const titlePropName = findProperty(['title', 'Title', 'name', 'Name'], propertyNames) || propertyNames[0];
        const datePropName = findProperty(['date', 'Date', 'created_time', 'Created Time'], propertyNames);
        const thumbnailPropName = findProperty(['thumbnail', 'Thumbnail', 'cover', 'Cover', 'image', 'Image'], propertyNames);
        const descriptionPropName = findProperty(['description', 'Description'], propertyNames);

        const properties = page.properties;
        const title = titlePropName ? extractPropertyValue(properties[titlePropName]) : 'Untitled';
        const thumbnail = thumbnailPropName ? extractPropertyValue(properties[thumbnailPropName]) : null;
        const date = datePropName ? extractPropertyValue(properties[datePropName]) : null;
        const description = descriptionPropName ? extractPropertyValue(properties[descriptionPropName]) : null;

        const contentResult = await extractPageContent(notion, formattedPageId);

        return {
          id: page.id,
          title,
          thumbnail,
          date,
          description,
          content: contentResult.text,
          contentHtml: contentResult.contentHtml || null,
          images: contentResult.images || [],
        };
      } catch (error) {
        console.error('Error fetching Notion blog article:', error);
        
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorType = error?.type || 'NOTION_FETCH_ERROR';
        
        if (error.name === 'MoleculerClientError' || error.type) {
          throw error;
        }
        
        throw new MoleculerClientError(
          `Failed to fetch Notion article: ${errorMessage}`,
          500,
          errorType,
          { 
            originalError: errorMessage,
            errorName: error?.name,
            errorStack: error?.stack
          }
        );
      }
    }
  },
};
